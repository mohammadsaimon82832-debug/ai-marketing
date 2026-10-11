import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

import { db } from './db.js';
import { generateText, listModels, testConnection } from './ollama.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? false
    : ['http://localhost:5173', 'http://localhost:5174'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const clientSchema = z.object({
  id: z.coerce.number().optional(),
  organization_id: z.coerce.number().optional().default(1),
  name: z.string().trim().min(2).max(160),
  industry: z.string().min(2).optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  contact_name: z.string().min(2).optional().or(z.literal('')),
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_phone: z.string().optional().or(z.literal('')),
  target_audience: z.string().optional().or(z.literal('')),
  brand_voice: z.string().optional().or(z.literal('')),
  preferred_language: z.string().optional().or(z.literal('English')),
  services: z.string().optional().or(z.literal('')),
  marketing_goals: z.string().optional().or(z.literal('')),
  brand_guidelines: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'paused', 'archived']).optional().default('active'),
  notes: z.string().optional().or(z.literal('')),
});

const campaignSchema = z.object({
  id: z.coerce.number().optional(),
  client_id: z.coerce.number().int().positive(),
  name: z.string().trim().min(2).max(160),
  objective: z.string().optional().or(z.literal('')),
  target_audience: z.string().optional().or(z.literal('')),
  platforms: z.string().optional().or(z.literal('')),
  budget: z.coerce.number().min(0).finite().optional().default(0),
  status: z.enum(['draft', 'active', 'paused', 'archived']).optional().default('draft'),
  start_date: z.string().optional().or(z.literal('')),
  due_date: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
});

const contentSchema = z.object({
  id: z.coerce.number().optional(),
  client_id: z.coerce.number().optional().nullable(),
  type: z.string().min(2),
  title: z.string().min(2),
  body: z.string().min(3),
  platform: z.string().optional().or(z.literal('')),
  tone: z.string().optional().or(z.literal('professional')),
  language: z.string().optional().or(z.literal('English')),
  status: z.enum(['draft', 'published', 'scheduled']).optional().default('draft'),
});

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
    } else if (character === '"' && value.length === 0) {
      quoted = true;
    } else if (character === ',') {
      row.push(value);
      value = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }

  if (quoted) throw new Error('CSV contains an unclosed quoted field.');
  row.push(value);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

function clientExists(clientId) {
  return Boolean(db.prepare('SELECT 1 FROM clients WHERE id = ?').get(clientId));
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'AI marketing platform is running.' });
});

app.get('/api/config', (req, res) => {
  res.json({
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    defaultModel: process.env.OLLAMA_MODEL || 'qwen2.5:3b',
  });
});

app.get('/api/ollama/models', async (req, res) => {
  const models = await listModels();
  res.json({ models });
});

app.get('/api/ollama/test', async (req, res) => {
  const result = await testConnection();
  res.json(result);
});

app.get('/api/dashboard', (req, res) => {
  const clients = db.prepare('SELECT * FROM clients ORDER BY updated_at DESC').all();
  const campaigns = db.prepare('SELECT * FROM campaigns ORDER BY updated_at DESC').all();
  const content = db.prepare('SELECT * FROM content_pieces ORDER BY created_at DESC').all();
  const leads = db.prepare('SELECT * FROM lead_records ORDER BY created_at DESC').all();
  const activities = db.prepare('SELECT * FROM ai_activities ORDER BY created_at DESC LIMIT 6').all();

  const totalClients = clients.length;
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === 'active').length;
  const totalContent = content.length;
  const totalLeads = leads.length;
  const averageLeadScore = leads.length
    ? Math.round(leads.reduce((sum, lead) => sum + Number(lead.score || 0), 0) / leads.length)
    : 0;
  const totalBudget = campaigns.reduce((sum, campaign) => sum + Number(campaign.budget || 0), 0);

  const chartData = campaigns.slice(0, 6).map((campaign, index) => ({
    name: campaign.name.length > 12 ? `${campaign.name.slice(0, 12)}...` : campaign.name,
    budget: Number(campaign.budget || 0),
    status: campaign.status,
    index,
  }));

  const tasks = campaigns
    .filter((campaign) => campaign.due_date && campaign.due_date >= new Date().toISOString().slice(0, 10) && campaign.status !== 'archived')
    .sort((left, right) => left.due_date.localeCompare(right.due_date))
    .slice(0, 5)
    .map((campaign) => ({
      id: campaign.id,
      title: campaign.name,
      dueDate: campaign.due_date,
      status: campaign.status,
      client: db.prepare('SELECT name FROM clients WHERE id = ?').get(campaign.client_id)?.name || 'Client',
    }));

  res.json({
    stats: {
      totalClients,
      activeCampaigns,
      totalContent,
      totalLeads,
      totalBudget,
      averageLeadScore,
    },
    chartData,
    tasks,
    activities,
    clients,
    campaigns,
    content,
    leads,
  });
});

app.get('/api/clients', (req, res) => {
  const results = db.prepare('SELECT * FROM clients ORDER BY updated_at DESC').all();
  res.json(results);
});

app.post('/api/clients', (req, res) => {
  const payload = clientSchema.parse(req.body);
  const insert = db.prepare(`
    INSERT INTO clients (
      organization_id, name, industry, website, contact_name, contact_email, contact_phone,
      target_audience, brand_voice, preferred_language, services, marketing_goals,
      brand_guidelines, status, notes, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  const result = insert.run(
    payload.organization_id,
    payload.name,
    payload.industry || '',
    payload.website || '',
    payload.contact_name || '',
    payload.contact_email || '',
    payload.contact_phone || '',
    payload.target_audience || '',
    payload.brand_voice || '',
    payload.preferred_language || 'English',
    payload.services || '',
    payload.marketing_goals || '',
    payload.brand_guidelines || '',
    payload.status || 'active',
    payload.notes || ''
  );

  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(client);
});

app.put('/api/clients/:id', (req, res) => {
  const payload = clientSchema.parse(req.body);
  const update = db.prepare(`
    UPDATE clients
    SET organization_id = ?, name = ?, industry = ?, website = ?, contact_name = ?, contact_email = ?,
        contact_phone = ?, target_audience = ?, brand_voice = ?, preferred_language = ?, services = ?,
        marketing_goals = ?, brand_guidelines = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  const result = update.run(
    payload.organization_id,
    payload.name,
    payload.industry || '',
    payload.website || '',
    payload.contact_name || '',
    payload.contact_email || '',
    payload.contact_phone || '',
    payload.target_audience || '',
    payload.brand_voice || '',
    payload.preferred_language || 'English',
    payload.services || '',
    payload.marketing_goals || '',
    payload.brand_guidelines || '',
    payload.status || 'active',
    payload.notes || '',
    Number(req.params.id)
  );

  if (!result.changes) {
    return res.status(404).json({ message: 'Client not found.' });
  }
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(Number(req.params.id));
  res.json(client);
});

app.delete('/api/clients/:id', (req, res) => {
  const id = Number(req.params.id);
  const removeClient = db.transaction(() => {
    db.prepare('DELETE FROM campaigns WHERE client_id = ?').run(id);
    db.prepare('DELETE FROM content_pieces WHERE client_id = ?').run(id);
    db.prepare('DELETE FROM lead_records WHERE client_id = ?').run(id);
    return db.prepare('DELETE FROM clients WHERE id = ?').run(id);
  });
  const result = removeClient();
  if (!result.changes) {
    return res.status(404).json({ message: 'Client not found.' });
  }
  res.json({ ok: result.changes > 0 });
});

app.get('/api/campaigns', (req, res) => {
  const campaigns = db.prepare('SELECT * FROM campaigns ORDER BY updated_at DESC').all();
  res.json(campaigns);
});

app.post('/api/campaigns', (req, res) => {
  const payload = campaignSchema.parse(req.body);
  if (!db.prepare('SELECT 1 FROM clients WHERE id = ?').get(payload.client_id)) {
    return res.status(404).json({ message: 'Client not found.' });
  }
  const insert = db.prepare(`
    INSERT INTO campaigns (
      client_id, name, objective, target_audience, platforms, budget, status, start_date, due_date, description, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  const result = insert.run(
    payload.client_id,
    payload.name,
    payload.objective || '',
    payload.target_audience || '',
    payload.platforms || '',
    payload.budget || 0,
    payload.status || 'draft',
    payload.start_date || '',
    payload.due_date || '',
    payload.description || ''
  );
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(campaign);
});

app.put('/api/campaigns/:id', (req, res) => {
  const payload = campaignSchema.parse(req.body);
  if (!db.prepare('SELECT 1 FROM clients WHERE id = ?').get(payload.client_id)) {
    return res.status(404).json({ message: 'Client not found.' });
  }
  const update = db.prepare(`
    UPDATE campaigns
    SET client_id = ?, name = ?, objective = ?, target_audience = ?, platforms = ?, budget = ?, status = ?,
        start_date = ?, due_date = ?, description = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  const result = update.run(
    payload.client_id,
    payload.name,
    payload.objective || '',
    payload.target_audience || '',
    payload.platforms || '',
    payload.budget || 0,
    payload.status || 'draft',
    payload.start_date || '',
    payload.due_date || '',
    payload.description || '',
    Number(req.params.id)
  );
  if (!result.changes) {
    return res.status(404).json({ message: 'Campaign not found.' });
  }
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(Number(req.params.id));
  res.json(campaign);
});

app.delete('/api/campaigns/:id', (req, res) => {
  const result = db.prepare('DELETE FROM campaigns WHERE id = ?').run(Number(req.params.id));
  if (!result.changes) {
    return res.status(404).json({ message: 'Campaign not found.' });
  }
  res.json({ ok: true });
});

app.post('/api/campaigns/:id/duplicate', (req, res) => {
  const source = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(Number(req.params.id));
  if (!source) {
    return res.status(404).json({ message: 'Campaign not found.' });
  }

  const duplicate = db.prepare(`
    INSERT INTO campaigns (client_id, name, objective, target_audience, platforms, budget, status, start_date, due_date, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = duplicate.run(
    source.client_id,
    `${source.name} Copy`,
    source.objective,
    source.target_audience,
    source.platforms,
    source.budget,
    'draft',
    source.start_date,
    source.due_date,
    source.description
  );

  const created = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

app.post('/api/campaigns/:id/archive', (req, res) => {
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(Number(req.params.id));
  if (!campaign) {
    return res.status(404).json({ message: 'Campaign not found.' });
  }
  const nextStatus = campaign.status === 'archived' ? 'active' : 'archived';
  db.prepare('UPDATE campaigns SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(nextStatus, Number(req.params.id));
  res.json({ status: nextStatus });
});

app.get('/api/content', (req, res) => {
  const pieces = db.prepare('SELECT * FROM content_pieces ORDER BY created_at DESC').all();
  res.json(pieces);
});

app.post('/api/content', (req, res) => {
  const payload = contentSchema.parse(req.body);
  if (payload.client_id && !clientExists(payload.client_id)) {
    return res.status(404).json({ message: 'Client not found.' });
  }
  const insert = db.prepare(`
    INSERT INTO content_pieces (client_id, type, title, body, platform, tone, language, status, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  const result = insert.run(
    payload.client_id || null,
    payload.type,
    payload.title,
    payload.body,
    payload.platform || '',
    payload.tone || 'professional',
    payload.language || 'English',
    payload.status || 'draft'
  );
  const content = db.prepare('SELECT * FROM content_pieces WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(content);
});

app.put('/api/content/:id', (req, res) => {
  const payload = contentSchema.parse(req.body);
  if (payload.client_id && !clientExists(payload.client_id)) {
    return res.status(404).json({ message: 'Client not found.' });
  }
  const result = db.prepare(`
    UPDATE content_pieces
    SET client_id = ?, type = ?, title = ?, body = ?, platform = ?, tone = ?, language = ?, status = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    payload.client_id || null,
    payload.type,
    payload.title,
    payload.body,
    payload.platform || '',
    payload.tone || 'professional',
    payload.language || 'English',
    payload.status || 'draft',
    Number(req.params.id)
  );

  if (!result.changes) {
    return res.status(404).json({ message: 'Content piece not found.' });
  }
  res.json(db.prepare('SELECT * FROM content_pieces WHERE id = ?').get(Number(req.params.id)));
});

app.delete('/api/content/:id', (req, res) => {
  const result = db.prepare('DELETE FROM content_pieces WHERE id = ?').run(Number(req.params.id));
  if (!result.changes) {
    return res.status(404).json({ message: 'Content piece not found.' });
  }
  res.json({ ok: true });
});

app.post('/api/content/generate', async (req, res) => {
  const { prompt, clientId, platform = 'Instagram', tone = 'professional', language = 'English', title = 'AI Generated Content', model } = req.body;
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ message: 'Prompt is required to generate content.' });
  }
  if (clientId && !clientExists(clientId)) {
    return res.status(404).json({ message: 'Client not found.' });
  }

  const agentOutput = await generateText({
    agent: 'AI Content Creator',
    prompt: `Generate content for a marketing campaign. Audience: ${platform} marketing. Tone: ${tone}. Language: ${language}. Request: ${prompt}`,
    model: model || process.env.OLLAMA_MODEL || 'qwen2.5:3b',
    temperature: 0.75,
    maxTokens: 600,
  });

  if (!agentOutput.ok) {
    return res.status(400).json({ message: agentOutput.message });
  }

  const insert = db.prepare(`
    INSERT INTO content_pieces (client_id, type, title, body, platform, tone, language, status, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', CURRENT_TIMESTAMP)
  `);
  const result = insert.run(clientId || null, 'generated', title, agentOutput.text, platform, tone, language);
  const content = db.prepare('SELECT * FROM content_pieces WHERE id = ?').get(result.lastInsertRowid);
  db.prepare('INSERT INTO ai_activities (agent_name, input_prompt, output_text, model_name) VALUES (?, ?, ?, ?)').run('AI Content Creator', prompt, agentOutput.text, agentOutput.model || model || process.env.OLLAMA_MODEL || 'qwen2.5:3b');

  res.status(201).json({ content, output: agentOutput.text, model: agentOutput.model });
});

app.post('/api/ai/generate', async (req, res) => {
  const schema = z.object({
    agent: z.string().min(2),
    prompt: z.string().min(5),
    model: z.string().optional().default(process.env.OLLAMA_MODEL || 'qwen2.5:3b'),
    temperature: z.coerce.number().min(0).max(1).optional().default(0.7),
    maxTokens: z.coerce.number().min(50).max(2000).optional().default(500),
  });

  const payload = schema.parse(req.body);
  const result = await generateText(payload);

  if (!result.ok) {
    return res.status(400).json({ message: result.message });
  }

  db.prepare('INSERT INTO ai_activities (agent_name, input_prompt, output_text, model_name) VALUES (?, ?, ?, ?)').run(
    payload.agent,
    payload.prompt,
    result.text,
    result.model
  );

  res.json({ output: result.text, model: result.model });
});

app.get('/api/ai/activity', (req, res) => {
  const activities = db.prepare('SELECT * FROM ai_activities ORDER BY created_at DESC LIMIT 20').all();
  res.json(activities);
});

app.post('/api/analytics/csv', (req, res) => {
  const { text } = req.body || {};
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ message: 'CSV text is required.' });
  }

  let rows;
  try {
    rows = parseCsv(text.replace(/^\uFEFF/, ''));
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
  if (rows.length < 2) {
    return res.status(400).json({ message: 'CSV file must include a header row and at least one dataset row.' });
  }

  const headers = rows[0].map((item) => item.trim().toLowerCase());
  if (new Set(headers).size !== headers.length) {
    return res.status(400).json({ message: 'CSV column names must be unique.' });
  }
  const requiredHeaders = ['spend', 'clicks', 'impressions', 'leads', 'revenue'];
  if (!requiredHeaders.some((header) => headers.includes(header))) {
    return res.status(400).json({ message: 'CSV must include at least one supported metric column: spend, clicks, impressions, leads, revenue.' });
  }
  const records = rows.slice(1).map((values) => {
    if (values.length > headers.length) {
      return null;
    }
    return Object.fromEntries(headers.map((key, index) => [key, values[index]?.trim() ?? '']));
  });
  if (records.some((record) => record === null)) {
    return res.status(400).json({ message: 'CSV rows must not contain more columns than the header.' });
  }

  let invalidMetrics = false;
  const metrics = records.map((row) => {
    const metric = (key) => {
      if (row[key] === undefined || row[key] === '') return null;
      const value = Number(row[key]);
      if (!Number.isFinite(value) || value < 0) {
        invalidMetrics = true;
        return null;
      }
      return value;
    };
    const spend = metric('spend');
    const clicks = metric('clicks');
    const impressions = metric('impressions');
    const leads = metric('leads');
    const revenue = metric('revenue');
    return {
      campaign: row.campaign || 'Untitled campaign',
      spend,
      leads,
      clicks,
      impressions,
      revenue,
      ctr: impressions !== null && clicks !== null && impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : null,
      conversionRate: clicks !== null && leads !== null && clicks > 0 ? ((leads / clicks) * 100).toFixed(2) : null,
      cpl: leads !== null && spend !== null && leads > 0 ? (spend / leads).toFixed(2) : null,
      roas: spend !== null && revenue !== null && spend > 0 ? (revenue / spend).toFixed(2) : null,
    };
  });

  if (invalidMetrics) {
    return res.status(400).json({ message: 'CSV metric values must be non-negative numbers.' });
  }

  const ctrRows = metrics.filter((item) => item.ctr !== null);
  const summary = {
    totalSpend: metrics.every((item) => item.spend !== null) ? metrics.reduce((sum, item) => sum + item.spend, 0) : null,
    totalLeads: metrics.every((item) => item.leads !== null) ? metrics.reduce((sum, item) => sum + item.leads, 0) : null,
    totalRevenue: metrics.every((item) => item.revenue !== null) ? metrics.reduce((sum, item) => sum + item.revenue, 0) : null,
    avgCtr: ctrRows.length
      ? (ctrRows.reduce((sum, item) => sum + Number(item.ctr), 0) / ctrRows.length).toFixed(2)
      : null,
  };

  res.json({ success: true, metrics, summary });
});

app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found.' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      message: 'Request validation failed.',
      errors: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    });
  }
  if (error.type === 'entity.parse.failed' || error.type === 'entity.too.large') {
    return res.status(error.status || 400).json({ message: error.type === 'entity.too.large' ? 'Request body is too large.' : 'Request body must be valid JSON.' });
  }
  console.error('Unhandled API error:', error);
  res.status(500).json({ message: 'An unexpected server error occurred.' });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'API route not found.' });
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || '127.0.0.1';
app.listen(port, host, () => {
  console.log(`AI Marketing Platform server running at http://${host}:${port}`);
});
