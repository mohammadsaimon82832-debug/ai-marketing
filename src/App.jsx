import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from 'recharts';

const navItems = [
  { label: 'Overview', icon: '◫' },
  { label: 'Clients', icon: '♧' },
  { label: 'Campaigns', icon: '▤' },
  { label: 'Content', icon: '✳' },
  { label: 'AI Workspace', icon: '✦' },
  { label: 'Analytics', icon: '⌁' },
];

const pageDescriptions = {
  Overview: 'A clear view of your agency work, client accounts, and active marketing.',
  Clients: 'Keep client details, brand context, and goals organized in one place.',
  Campaigns: 'Plan, track, and manage campaign work across your client roster.',
  Content: 'Create platform-ready content with your local AI model.',
  'AI Workspace': 'Work with specialized marketing agents powered by Ollama.',
  Analytics: 'Import campaign data to calculate performance from real metrics.',
};

const handleCsvUpload = async (event) => {
  const input = event.currentTarget;
  const file = input.files?.[0];
  if (!file) return;
  setAnalyticsBusy(true);
  setError('');
  try {
    const text = await file.text();
    const result = await apiFetch('/api/analytics/csv', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    setDashboard((previous) => ({ ...previous, analytics: result }));
    setNotice(t('CSV imported successfully.'));
  } catch (uploadError) {
    setError(t(uploadError.message || 'CSV import failed.'));
  } finally {
    setAnalyticsBusy(false);
    input.value = '';
  }
};

const bengaliTranslations = {
  Overview: 'সারসংক্ষেপ',
  Clients: 'ক্লায়েন্ট',
  Campaigns: 'ক্যাম্পেইন',
  Content: 'কনটেন্ট',
  'AI Workspace': 'এআই ওয়ার্কস্পেস',
  Analytics: 'অ্যানালিটিক্স',
  'A clear view of your agency work, client accounts, and active marketing.': 'এজেন্সির কাজ, ক্লায়েন্ট এবং চলমান মার্কেটিং কার্যক্রমের এক নজরের চিত্র।',
  'Keep client details, brand context, and goals organized in one place.': 'ক্লায়েন্টের তথ্য, ব্র্যান্ড পরিচিতি ও লক্ষ্য এক জায়গায় গুছিয়ে রাখুন।',
  'Plan, track, and manage campaign work across your client roster.': 'সব ক্লায়েন্টের ক্যাম্পেইন পরিকল্পনা, অগ্রগতি ও ব্যবস্থাপনা করুন।',
  'Create platform-ready content with your local AI model.': 'আপনার স্থানীয় এআই মডেল দিয়ে বিভিন্ন প্ল্যাটফর্মের উপযোগী কনটেন্ট তৈরি করুন।',
  'Work with specialized marketing agents powered by Ollama.': 'Ollama-চালিত বিশেষায়িত মার্কেটিং এজেন্ট ব্যবহার করুন।',
  'Import campaign data to calculate performance from real metrics.': 'প্রকৃত মেট্রিক দিয়ে পারফরম্যান্স হিসাব করতে ক্যাম্পেইনের ডেটা ইমপোর্ট করুন।',
  'Marketing OS': 'মার্কেটিং ওএস',
  'Agency workspace': 'এজেন্সি ওয়ার্কস্পেস',
  WORKSPACE: 'ওয়ার্কস্পেস',
  'Local AI': 'স্থানীয় এআই',
  'Ollama connection': 'Ollama সংযোগ',
  'Not checked': 'যাচাই করা হয়নি',
  'Check connection': 'সংযোগ যাচাই',
  'Agency account': 'এজেন্সি অ্যাকাউন্ট',
  'Local workspace': 'স্থানীয় ওয়ার্কস্পেস',
  'Switch to light theme': 'লাইট থিম চালু করুন',
  'Switch to dark theme': 'ডার্ক থিম চালু করুন',
  'Toggle theme': 'থিম পরিবর্তন',
  Refresh: 'রিফ্রেশ',
  Refreshing: 'রিফ্রেশ হচ্ছে',
  'New AI brief': 'নতুন এআই ব্রিফ',
  'Total clients': 'মোট ক্লায়েন্ট',
  'Active campaigns': 'সক্রিয় ক্যাম্পেইন',
  'Content pieces': 'কনটেন্টের সংখ্যা',
  'Leads tracked': 'ট্র্যাক করা লিড',
  'Active and paused accounts': 'সক্রিয় ও বিরত অ্যাকাউন্ট',
  'Currently in motion': 'এখন চলমান',
  'Saved posts and marketing assets': 'সংরক্ষিত পোস্ট ও মার্কেটিং উপকরণ',
  'average score': 'গড় স্কোর',
  'Campaign investment': 'ক্যাম্পেইন বিনিয়োগ',
  'Planned budget across campaigns': 'ক্যাম্পেইনগুলোর পরিকল্পিত বাজেট',
  'No campaigns yet': 'এখনও কোনো ক্যাম্পেইন নেই',
  'Create a campaign to see planned investment here.': 'পরিকল্পিত বিনিয়োগ দেখতে একটি ক্যাম্পেইন তৈরি করুন।',
  'Create a campaign': 'ক্যাম্পেইন তৈরি করুন',
  'Recent AI activity': 'সাম্প্রতিক এআই কার্যক্রম',
  Latest: 'সর্বশেষ',
  'No AI activity yet': 'এখনও কোনো এআই কার্যক্রম নেই',
  'Run an agent brief to see results here.': 'ফলাফল দেখতে একটি এজেন্ট ব্রিফ চালান।',
  'Upcoming tasks': 'আসন্ন কাজ',
  'No upcoming campaign deadlines.': 'কোনো আসন্ন ক্যাম্পেইন ডেডলাইন নেই।',
  'Lead pipeline': 'লিড পাইপলাইন',
  'No lead data yet': 'এখনও কোনো লিড ডেটা নেই',
  'Lead performance will appear when you have records.': 'লিডের তথ্য যোগ হলে পারফরম্যান্স এখানে দেখা যাবে।',
  'Recent content': 'সাম্প্রতিক কনটেন্ট',
  'Drafts and published pieces': 'খসড়া ও প্রকাশিত কনটেন্ট',
  'View all': 'সব দেখুন',
  'Your saved content will show here.': 'সংরক্ষিত কনটেন্ট এখানে দেখা যাবে।',
  'Add client': 'ক্লায়েন্ট যোগ করুন',
  'Edit client': 'ক্লায়েন্ট সম্পাদনা',
  'Business name': 'প্রতিষ্ঠানের নাম',
  Industry: 'শিল্পখাত',
  Website: 'ওয়েবসাইট',
  'Contact name': 'যোগাযোগের ব্যক্তির নাম',
  'Contact email': 'যোগাযোগের ইমেইল',
  Phone: 'ফোন',
  'Target audience': 'লক্ষ্য শ্রোতা',
  'Marketing goals': 'মার্কেটিং লক্ষ্য',
  English: 'ইংরেজি',
  Bangla: 'বাংলা',
  Bilingual: 'দ্বিভাষিক',
  Active: 'সক্রিয়',
  active: 'সক্রিয়',
  Paused: 'বিরত',
  paused: 'বিরত',
  Archived: 'আর্কাইভ করা',
  archived: 'আর্কাইভ করা',
  Notes: 'নোট',
  draft: 'খসড়া',
  published: 'প্রকাশিত',
  generated: 'তৈরি করা',
  Published: 'প্রকাশিত',
  'No Ollama models are available. Start Ollama and pull a model.': 'কোনো Ollama মডেল পাওয়া যায়নি। Ollama চালু করে একটি মডেল ডাউনলোড করুন।',
  'Update client': 'ক্লায়েন্ট আপডেট',
  'Save client': 'ক্লায়েন্ট সংরক্ষণ',
  Reset: 'রিসেট',
  'Client roster': 'ক্লায়েন্ট তালিকা',
  Edit: 'সম্পাদনা',
  Delete: 'মুছুন',
  'Edit campaign': 'ক্যাম্পেইন সম্পাদনা',
  'Create campaign': 'ক্যাম্পেইন তৈরি',
  'Select client': 'ক্লায়েন্ট নির্বাচন করুন',
  'Campaign title': 'ক্যাম্পেইনের শিরোনাম',
  Description: 'বিবরণ',
  Objective: 'উদ্দেশ্য',
  'Platforms (comma separated)': 'প্ল্যাটফর্ম (কমা দিয়ে আলাদা করুন)',
  Budget: 'বাজেট',
  Draft: 'খসড়া',
  'Save campaign': 'ক্যাম্পেইন সংরক্ষণ',
  'Update campaign': 'ক্যাম্পেইন আপডেট',
  Duplicate: 'কপি তৈরি',
  Archive: 'আর্কাইভ',
  Unarchive: 'আর্কাইভ থেকে ফিরিয়ে আনুন',
  'Content studio': 'কনটেন্ট স্টুডিও',
  'Social post': 'সোশ্যাল পোস্ট',
  'Ad copy': 'বিজ্ঞাপনের কপি',
  Email: 'ইমেইল',
  'Landing page': 'ল্যান্ডিং পেজ',
  Professional: 'পেশাদার',
  Friendly: 'বন্ধুত্বপূর্ণ',
  Persuasive: 'প্রভাবশালী',
  Conversational: 'কথোপকথনমূলক',
  'Campaign title or content brief': 'ক্যাম্পেইনের শিরোনাম বা কনটেন্ট ব্রিফ',
  'Describe the message, audience, offer, and CTA': 'বার্তা, শ্রোতা, অফার ও CTA বর্ণনা করুন',
  Generating: 'তৈরি হচ্ছে',
  'Generate content': 'কনটেন্ট তৈরি করুন',
  'Generated library': 'তৈরি করা কনটেন্ট',
  'Multi-agent workflow': 'মাল্টি-এজেন্ট ওয়ার্কফ্লো',
  'Describe your marketing objective, target audience, product, and output requirements': 'মার্কেটিং লক্ষ্য, শ্রোতা, পণ্য ও আউটপুটের প্রয়োজনীয়তা লিখুন',
  'Run agent': 'এজেন্ট চালান',
  'Agent output': 'এজেন্টের ফলাফল',
  'No output yet. Use the agent to generate a recommendation.': 'এখনও কোনো ফলাফল নেই। পরামর্শ পেতে এজেন্ট ব্যবহার করুন।',
  'AI Marketing Strategist': 'এআই মার্কেটিং কৌশলবিদ',
  'AI Content Creator': 'এআই কনটেন্ট নির্মাতা',
  'AI SEO Agent': 'এআই এসইও এজেন্ট',
  'AI Advertising Agent': 'এআই বিজ্ঞাপন এজেন্ট',
  'AI Social Media Manager': 'এআই সোশ্যাল মিডিয়া ম্যানেজার',
  'AI Marketing Analyst': 'এআই মার্কেটিং বিশ্লেষক',
  'AI Customer Acquisition Agent': 'এআই গ্রাহক অর্জন এজেন্ট',
  'Social media manager': 'সোশ্যাল মিডিয়া ম্যানেজার',
  Instagram: 'ইনস্টাগ্রাম',
  Facebook: 'ফেসবুক',
  Google: 'গুগল',
  'Email marketing': 'ইমেইল মার্কেটিং',
  'Select a language': 'ভাষা নির্বাচন করুন',
  'Interface language': 'ইন্টারফেসের ভাষা',
  'Generated content': 'তৈরি করা কনটেন্ট',
  'No content yet.': 'এখনও কোনো কনটেন্ট নেই।',
  'Upload campaign CSV': 'ক্যাম্পেইনের CSV আপলোড',
  'Choose CSV file': 'CSV ফাইল নির্বাচন করুন',
  'Total spend:': 'মোট ব্যয়:',
  'Total leads:': 'মোট লিড:',
  'Average CTR:': 'গড় CTR:',
  'Performance insights': 'পারফরম্যান্স বিশ্লেষণ',
  leads: 'লিড',
  'Loading platform data…': 'প্ল্যাটফর্মের তথ্য লোড হচ্ছে…',
  'Request failed': 'অনুরোধটি সম্পন্ন করা যায়নি',
  'Unable to load dashboard data.': 'ড্যাশবোর্ডের তথ্য লোড করা যায়নি।',
  'Failed to save client.': 'ক্লায়েন্ট সংরক্ষণ করা যায়নি।',
  'Failed to save campaign.': 'ক্যাম্পেইন সংরক্ষণ করা যায়নি।',
  'Failed to delete client.': 'ক্লায়েন্ট মুছে ফেলা যায়নি।',
  'Campaign action failed.': 'ক্যাম্পেইনের কাজটি সম্পন্ন করা যায়নি।',
  'Content generation failed.': 'কনটেন্ট তৈরি করা যায়নি।',
  'AI generation failed.': 'এআই কনটেন্ট তৈরি করা যায়নি।',
  'Connection check failed': 'সংযোগ যাচাই করা যায়নি',
  'Ollama is not reachable or is not responding. Please confirm the server is running on the configured URL.': 'Ollama-তে সংযোগ করা যাচ্ছে না। সার্ভারটি চালু আছে এবং URL সঠিক কি না যাচাই করুন।',
  'Ollama connection failed. Start Ollama locally and ensure the URL is valid.': 'Ollama-তে সংযোগ ব্যর্থ। স্থানীয়ভাবে Ollama চালু করে URL যাচাই করুন।',
  'The selected Ollama model did not return a usable response. Try another model or verify that Ollama is running.': 'নির্বাচিত Ollama মডেল থেকে ব্যবহারযোগ্য উত্তর পাওয়া যায়নি। অন্য মডেল নির্বাচন করুন বা Ollama চালু আছে কি না যাচাই করুন।',
  'Unable to generate content from Ollama. Check the Ollama server and model selection.': 'Ollama থেকে কনটেন্ট তৈরি করা যায়নি। Ollama সার্ভার ও নির্বাচিত মডেল যাচাই করুন।',
  'Prompt is required to generate content.': 'কনটেন্ট তৈরির জন্য একটি প্রম্পট লিখুন।',
  'CSV text is required.': 'CSV ফাইলের তথ্য প্রয়োজন।',
  'CSV file must include a header row and at least one dataset row.': 'CSV ফাইলে শিরোনামের সারি এবং অন্তত একটি ডেটা সারি থাকতে হবে।',
  'CSV must include at least one supported metric column: spend, clicks, impressions, leads, revenue.': 'CSV-তে অন্তত একটি সমর্থিত মেট্রিক কলাম থাকতে হবে: spend, clicks, impressions, leads, revenue।',
  'CSV metric values must be non-negative numbers.': 'CSV মেট্রিকের মান শূন্য বা তার বেশি সংখ্যা হতে হবে।',
  'Request validation failed.': 'অনুরোধের তথ্য যাচাই করা যায়নি।',
  'Client not found.': 'ক্লায়েন্ট পাওয়া যায়নি।',
  'Campaign not found.': 'ক্যাম্পেইন পাওয়া যায়নি।',
  'Content piece not found.': 'কনটেন্ট পাওয়া যায়নি।',
  'API route not found.': 'API রুট পাওয়া যায়নি।',
  'Request body is too large.': 'অনুরোধের তথ্য অনেক বড়।',
  'Request body must be valid JSON.': 'অনুরোধের তথ্য বৈধ JSON হতে হবে।',
  'An unexpected server error occurred.': 'সার্ভারে অপ্রত্যাশিত সমস্যা হয়েছে।',
  Search: 'খুঁজুন',
  'Search clients': 'ক্লায়েন্ট খুঁজুন',
  'Search campaigns': 'ক্যাম্পেইন খুঁজুন',
  'Search content': 'কনটেন্ট খুঁজুন',
  'All statuses': 'সব অবস্থা',
  'No clients match your search.': 'আপনার অনুসন্ধানের সঙ্গে কোনো ক্লায়েন্ট মেলেনি।',
  'No campaigns match your search.': 'আপনার অনুসন্ধানের সঙ্গে কোনো ক্যাম্পেইন মেলেনি।',
  'No content matches your search.': 'আপনার অনুসন্ধানের সঙ্গে কোনো কনটেন্ট মেলেনি।',
  'Edit content': 'কনটেন্ট সম্পাদনা',
  'Save changes': 'পরিবর্তন সংরক্ষণ',
  'Cancel editing': 'সম্পাদনা বাতিল',
  'Copy text': 'লেখা কপি করুন',
  'Copied to clipboard': 'ক্লিপবোর্ডে কপি হয়েছে',
  'Could not copy content.': 'কনটেন্ট কপি করা যায়নি।',
  'Delete this client and its related records?': 'এই ক্লায়েন্ট এবং সংশ্লিষ্ট তথ্য মুছে ফেলবেন?',
  'Delete this campaign?': 'এই ক্যাম্পেইন মুছে ফেলবেন?',
  'Delete this content piece?': 'এই কনটেন্টটি মুছে ফেলবেন?',
  'Client deleted.': 'ক্লায়েন্ট মুছে ফেলা হয়েছে।',
  'Campaign deleted.': 'ক্যাম্পেইন মুছে ফেলা হয়েছে।',
  'Content deleted.': 'কনটেন্ট মুছে ফেলা হয়েছে।',
  'Client saved.': 'ক্লায়েন্ট সংরক্ষিত হয়েছে।',
  'Campaign saved.': 'ক্যাম্পেইন সংরক্ষিত হয়েছে।',
  'Content saved.': 'কনটেন্ট সংরক্ষিত হয়েছে।',
  'Content generated and saved.': 'কনটেন্ট তৈরি ও সংরক্ষণ করা হয়েছে।',
  'No clients yet. Add your first client to get started.': 'এখনও কোনো ক্লায়েন্ট নেই। শুরু করতে প্রথম ক্লায়েন্ট যোগ করুন।',
  'No campaigns yet. Create your first campaign to get started.': 'এখনও কোনো ক্যাম্পেইন নেই। শুরু করতে প্রথম ক্যাম্পেইন তৈরি করুন।',
  'No content saved yet. Generate your first piece to get started.': 'এখনও কোনো কনটেন্ট নেই। শুরু করতে প্রথম কনটেন্ট তৈরি করুন।',
  'No analytics data yet. Choose a campaign CSV to calculate available metrics.': 'এখনও অ্যানালিটিক্স ডেটা নেই। উপলভ্য মেট্রিক হিসাব করতে ক্যাম্পেইন CSV নির্বাচন করুন।',
  'Importing CSV…': 'CSV ইমপোর্ট হচ্ছে…',
  'Filter by status': 'অবস্থা অনুযায়ী ফিল্টার',
  'Dismiss message': 'বার্তা বন্ধ করুন',
  'Filter by status': 'অবস্থা অনুযায়ী ফিল্টার',
  'Dismiss message': 'বার্তা বন্ধ করুন',
  'CSV import failed.': 'CSV ইমপোর্ট করা যায়নি।',
  'CSV imported successfully.': 'CSV সফলভাবে ইমপোর্ট হয়েছে।',
  'Content save failed.': 'কনটেন্ট সংরক্ষণ করা যায়নি।',
  'Content delete failed.': 'কনটেন্ট মুছে ফেলা যায়নি।',
  'Choose CSV file': 'CSV ফাইল নির্বাচন করুন',
  'Unarchive': 'আর্কাইভ থেকে ফিরিয়ে আনুন',
  'Do you want to delete this item?': 'এই তথ্যটি মুছে ফেলতে চান?',
  'All': 'সব',
};

const defaultClientForm = {
  id: '',
  name: '',
  industry: '',
  website: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  target_audience: '',
  brand_voice: '',
  preferred_language: 'English',
  services: '',
  marketing_goals: '',
  brand_guidelines: '',
  status: 'active',
  notes: '',
};

const defaultCampaignForm = {
  id: '',
  client_id: '',
  name: '',
  objective: '',
  target_audience: '',
  platforms: '',
  budget: 0,
  status: 'draft',
  start_date: '',
  due_date: '',
  description: '',
};

const defaultContentForm = {
  client_id: '',
  type: 'post',
  title: '',
  body: '',
  platform: 'Instagram',
  tone: 'professional',
  language: 'English',
  status: 'draft',
};

const defaultAiForm = {
  agent: 'AI Marketing Strategist',
  prompt: '',
  model: '',
  temperature: 0.7,
  maxTokens: 500,
};

const formatCurrency = (value, language) =>
  new Intl.NumberFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatNumber = (value, language) =>
  new Intl.NumberFormat(language === 'bn' ? 'bn-BD' : 'en-US').format(Number(value || 0));

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.message || 'Request failed');
  }

  return res.json();
}

function StatCard({ label, value, detail, tone = 'blue', language }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{typeof value === 'number' ? formatNumber(value, language) : value}</div>
      <div className="stat-detail">{detail}</div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [dashboard, setDashboard] = useState({ stats: {}, chartData: [], tasks: [], activities: [], clients: [], campaigns: [], content: [], leads: [] });
  const [clients, setClients] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [contentItems, setContentItems] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [campaignSearch, setCampaignSearch] = useState('');
  const [contentSearch, setContentSearch] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState('all');
  const [campaignStatusFilter, setCampaignStatusFilter] = useState('all');
  const [contentStatusFilter, setContentStatusFilter] = useState('all');
  const [analyticsBusy, setAnalyticsBusy] = useState(false);
  const [clientForm, setClientForm] = useState(defaultClientForm);
  const [campaignForm, setCampaignForm] = useState(defaultCampaignForm);
  const [contentForm, setContentForm] = useState(defaultContentForm);
  const [aiForm, setAiForm] = useState(defaultAiForm);
  const [aiOutput, setAiOutput] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [models, setModels] = useState([]);
  const [ollamaStatus, setOllamaStatus] = useState('Not checked');
  const [theme, setTheme] = useState(() => localStorage.getItem('northstar-theme') || 'dark');
  const [language, setLanguage] = useState(() => localStorage.getItem('northstar-language') === 'bn' ? 'bn' : 'en');
  const t = (text) => (language === 'bn' ? bengaliTranslations[text] || text : text);

  const totalBudget = useMemo(
    () => campaigns.reduce((sum, campaign) => sum + Number(campaign.budget || 0), 0),
    [campaigns]
  );

  const filteredClients = useMemo(() => {
    const query = clientSearch.trim().toLowerCase();
    return clients.filter((client) => {
      const matchesQuery = !query || [client.name, client.industry, client.contact_name, client.contact_email]
        .some((value) => String(value || '').toLowerCase().includes(query));
      return matchesQuery && (clientStatusFilter === 'all' || client.status === clientStatusFilter);
    });
  }, [clients, clientSearch, clientStatusFilter]);

  const filteredCampaigns = useMemo(() => {
    const query = campaignSearch.trim().toLowerCase();
    return campaigns.filter((campaign) => {
      const matchesQuery = !query || [campaign.name, campaign.objective, campaign.target_audience, campaign.platforms]
        .some((value) => String(value || '').toLowerCase().includes(query));
      return matchesQuery && (campaignStatusFilter === 'all' || campaign.status === campaignStatusFilter);
    });
  }, [campaigns, campaignSearch, campaignStatusFilter]);

  const filteredContentItems = useMemo(() => {
    const query = contentSearch.trim().toLowerCase();
    return contentItems.filter((item) => {
      const matchesQuery = !query || [item.title, item.body, item.type, item.platform]
        .some((value) => String(value || '').toLowerCase().includes(query));
      return matchesQuery && (contentStatusFilter === 'all' || item.status === contentStatusFilter);
    });
  }, [contentItems, contentSearch, contentStatusFilter]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboardData, clientData, campaignData, contentData, activityData, modelData] = await Promise.all([
        apiFetch('/api/dashboard'),
        apiFetch('/api/clients'),
        apiFetch('/api/campaigns'),
        apiFetch('/api/content'),
        apiFetch('/api/ai/activity'),
        apiFetch('/api/ollama/models'),
      ]);

      setDashboard(dashboardData);
      setClients(clientData);
      setCampaigns(campaignData);
      setContentItems(contentData);
      setActivityFeed(activityData);
      setModels(modelData.models || []);
      if (modelData.models?.length) {
        setAiForm((prev) => ({
          ...prev,
          model: modelData.models.includes(prev.model) ? prev.model : modelData.models[0],
        }));
      }
    } catch (loadError) {
      setError(t(loadError.message || 'Unable to load dashboard data.'));
    } finally {
      setLoading(false);
    }
  };

  const testOllama = async () => {
    try {
      const result = await apiFetch('/api/ollama/test');
      setOllamaStatus(result.ok ? `Connected (${result.models?.length || 0} models)` : t(result.message));
    } catch (error) {
      setOllamaStatus(t(error.message || 'Connection check failed'));
    }
  };

  useEffect(() => {
    loadData();
    testOllama();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('northstar-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language === 'bn' ? 'bn' : 'en';
    document.title = language === 'bn' ? 'নর্থস্টার | মার্কেটিং ওএস' : 'AI Marketing Agency Platform';
    localStorage.setItem('northstar-language', language);
  }, [language]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(''), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const handleClientSubmit = async (event) => {
    event.preventDefault();
    try {
      if (clientForm.id) {
        const updated = await apiFetch(`/api/clients/${clientForm.id}`, {
          method: 'PUT',
          body: JSON.stringify(clientForm),
        });
        setClients((prev) => prev.map((client) => (client.id === updated.id ? updated : client)));
      } else {
        const created = await apiFetch('/api/clients', {
          method: 'POST',
          body: JSON.stringify(clientForm),
        });
        setClients((prev) => [created, ...prev]);
      }
      setClientForm(defaultClientForm);
      setNotice(t('Client saved.'));
      await loadData();
    } catch (submitError) {
      setError(t(submitError.message || 'Failed to save client.'));
    }
  };

  const handleCampaignSubmit = async (event) => {
    event.preventDefault();
    try {
      if (campaignForm.id) {
        const updated = await apiFetch(`/api/campaigns/${campaignForm.id}`, {
          method: 'PUT',
          body: JSON.stringify(campaignForm),
        });
        setCampaigns((prev) => prev.map((campaign) => (campaign.id === updated.id ? updated : campaign)));
      } else {
        const created = await apiFetch('/api/campaigns', {
          method: 'POST',
          body: JSON.stringify(campaignForm),
        });
        setCampaigns((prev) => [created, ...prev]);
      }
      setCampaignForm(defaultCampaignForm);
      setNotice(t('Campaign saved.'));
      await loadData();
    } catch (submitError) {
      setError(t(submitError.message || 'Failed to save campaign.'));
    }
  };

  const handleClientDelete = async (id) => {
    if (!window.confirm(t('Delete this client and its related records?'))) return;
    try {
      await apiFetch(`/api/clients/${id}`, { method: 'DELETE' });
      setClients((prev) => prev.filter((client) => client.id !== id));
      setCampaigns((prev) => prev.filter((campaign) => campaign.client_id !== id));
      setContentItems((prev) => prev.filter((item) => item.client_id !== id));
      setNotice(t('Client deleted.'));
      await loadData();
    } catch (deleteError) {
      setError(t(deleteError.message || 'Failed to delete client.'));
    }
  };

  const handleCampaignAction = async (action, id) => {
    try {
      if (action === 'duplicate') {
        const created = await apiFetch(`/api/campaigns/${id}/duplicate`, { method: 'POST' });
        setCampaigns((prev) => [created, ...prev]);
      }
      if (action === 'archive' || action === 'unarchive') {
        const result = await apiFetch(`/api/campaigns/${id}/archive`, { method: 'POST' });
        setCampaigns((prev) => prev.map((campaign) => (campaign.id === id ? { ...campaign, status: result.status } : campaign)));
      }
      if (action === 'delete') {
        if (!window.confirm(t('Delete this campaign?'))) return;
        await apiFetch(`/api/campaigns/${id}`, { method: 'DELETE' });
        setNotice(t('Campaign deleted.'));
      }
      await loadData();
    } catch (submitError) {
      setError(t(submitError.message || 'Campaign action failed.'));
    }
  };

  const handleContentGenerate = async (event) => {
    event.preventDefault();
    setAiBusy(true);
    setError('');
    try {
      const payload = {
        prompt: contentForm.body || contentForm.title,
        clientId: contentForm.client_id || null,
        platform: contentForm.platform,
        tone: contentForm.tone,
        language: contentForm.language,
        title: contentForm.title || 'AI Generated Content',
      };
      const result = await apiFetch('/api/content/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setContentItems((prev) => [result.content, ...prev]);
      setAiOutput(result.output);
      setContentForm(defaultContentForm);
      setNotice(t('Content generated and saved.'));
      await loadData();
    } catch (submitError) {
      setError(t(submitError.message || 'Content generation failed.'));
    } finally {
      setAiBusy(false);
    }
  };

  const handleContentEdit = (item) => {
    setContentForm({
      id: item.id,
      client_id: item.client_id || '',
      type: item.type,
      title: item.title,
      body: item.body,
      platform: item.platform || 'Instagram',
      tone: item.tone || 'professional',
      language: item.language || 'English',
      status: item.status || 'draft',
    });
    setActiveTab('Content');
  };

  const handleContentSave = async (event) => {
    event.preventDefault();
    try {
      const updated = await apiFetch(`/api/content/${contentForm.id}`, {
        method: 'PUT',
        body: JSON.stringify(contentForm),
      });
      setContentItems((previous) => previous.map((item) => item.id === updated.id ? updated : item));
      setContentForm(defaultContentForm);
      setNotice(t('Content saved.'));
      await loadData();
    } catch (saveError) {
      setError(t(saveError.message || 'Content save failed.'));
    }
  };

  const handleContentDelete = async (id) => {
    if (!window.confirm(t('Delete this content piece?'))) return;
    try {
      await apiFetch(`/api/content/${id}`, { method: 'DELETE' });
      setContentItems((previous) => previous.filter((item) => item.id !== id));
      setNotice(t('Content deleted.'));
      await loadData();
    } catch (deleteError) {
      setError(t(deleteError.message || 'Content delete failed.'));
    }
  };

  const handleCopyContent = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(t('Copied to clipboard'));
    } catch {
      setError(t('Could not copy content.'));
    }
  };

  const handleAiGenerate = async (event) => {
    event.preventDefault();
    setAiBusy(true);
    setError('');
    try {
      const result = await apiFetch('/api/ai/generate', {
        method: 'POST',
        body: JSON.stringify(aiForm),
      });
      setAiOutput(result.output);
      setActivityFeed((prev) => [{
        id: Date.now(),
        agent_name: aiForm.agent,
        input_prompt: aiForm.prompt,
        output_text: result.output,
        model_name: aiForm.model,
        created_at: new Date().toISOString(),
      }, ...prev]);
      loadData();
    } catch (submitError) {
      setError(t(submitError.message || 'AI generation failed.'));
    } finally {
      setAiBusy(false);
    }
  };

  const activePage = (() => {
    if (activeTab === 'Clients') return 'clients';
    if (activeTab === 'Campaigns') return 'campaigns';
    if (activeTab === 'Content') return 'content';
    if (activeTab === 'AI Workspace') return 'ai';
    if (activeTab === 'Analytics') return 'analytics';
    return 'overview';
  })();

  return (
    <div className={`app-shell theme-${theme}`}>
      <aside className={`sidebar ${language === 'bn' ? 'language-bn' : ''}`}>
        <div className="brand-block">
          <div className="brand-mark">N</div>
          <div>
            <strong>Northstar</strong>
            <span>{t('Marketing OS')}</span>
          </div>
        </div>

        <div className="workspace-label">
          <span className="workspace-avatar">N</span>
          <span><strong>Northstar Studio</strong><small>{t('Agency workspace')}</small></span>
          <span className="workspace-chevron" aria-hidden="true">⌄</span>
        </div>

        <span className="nav-caption">{t('WORKSPACE')}</span>
        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={item.label === activeTab ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveTab(item.label)}
              aria-current={item.label === activeTab ? 'page' : undefined}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span>{t(item.label)}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-card">
          <div className="sidebar-card-heading">
            <span className="connection-icon">✦</span>
            <span><strong>{t('Local AI')}</strong><small>{t('Ollama connection')}</small></span>
          </div>
          <div className="connection-state">
            <span className={`status-dot ${ollamaStatus.startsWith('Connected') ? 'online' : ''}`} />
            <span>{ollamaStatus.startsWith('Connected') ? (language === 'bn' ? `সংযুক্ত (${models.length}টি মডেল)` : ollamaStatus) : t(ollamaStatus)}</span>
          </div>
          <div className="tiny-list">
            {models.slice(0, 4).map((model) => (
              <span key={model}>{model}</span>
            ))}
          </div>
          <button className="secondary-btn" onClick={testOllama}>{t('Check connection')}</button>
        </div>
        <div className="sidebar-footer"><span className="profile-avatar">NS</span><span><strong>{t('Agency account')}</strong><small>{t('Local workspace')}</small></span></div>
      </aside>

      <main className="content-panel">
        <header className="topbar">
          <div className="page-heading">
            <div className="breadcrumb"><span>Northstar Studio</span><span className="breadcrumb-separator">/</span><strong>{t(activeTab)}</strong></div>
            <h1>{t(activeTab)}</h1>
            <p>{t(pageDescriptions[activeTab])}</p>
          </div>
          <div className="topbar-actions">
            <label className="language-select-label">
              <span className="sr-only">{t('Interface language')}</span>
              <select className="language-select" aria-label={t('Interface language')} value={language} onChange={(event) => setLanguage(event.target.value)}>
                <option value="en">EN</option>
                <option value="bn">বাংলা</option>
              </select>
            </label>
            <button className="icon-button" aria-label={t(theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme')} title={t('Toggle theme')} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? '☼' : '☾'}
            </button>
            <button className="secondary-btn refresh-btn" onClick={loadData} disabled={loading}>
              <span aria-hidden="true" className={loading ? 'refresh-icon is-loading' : 'refresh-icon'}>↻</span>
              {loading ? t('Refreshing') : t('Refresh')}
            </button>
            <button className="primary-btn" onClick={() => setActiveTab('AI Workspace')}><span aria-hidden="true">✦</span> {t('New AI brief')}</button>
          </div>
        </header>

        {error ? <div className="alert-box" role="alert"><span>{error}</span><button aria-label={language === 'bn' ? 'বার্তা বন্ধ করুন' : 'Dismiss message'} onClick={() => setError('')}>×</button></div> : null}
        {notice ? <div className="notice-box" role="status"><span>{notice}</span><button aria-label={language === 'bn' ? 'বার্তা বন্ধ করুন' : 'Dismiss message'} onClick={() => setNotice('')}>×</button></div> : null}

        {activePage === 'overview' ? (
          <>
            <section className="stats-grid">
              <StatCard label={t('Total clients')} value={dashboard.stats.totalClients ?? clients.length} detail={t('Active and paused accounts')} tone="blue" language={language} />
              <StatCard label={t('Active campaigns')} value={dashboard.stats.activeCampaigns ?? campaigns.filter((item) => item.status === 'active').length} detail={t('Currently in motion')} tone="green" language={language} />
              <StatCard label={t('Content pieces')} value={dashboard.stats.totalContent ?? contentItems.length} detail={t('Saved posts and marketing assets')} tone="purple" language={language} />
              <StatCard label={t('Leads tracked')} value={dashboard.stats.totalLeads ?? dashboard.leads?.length ?? 0} detail={`${formatNumber(dashboard.stats.averageLeadScore ?? 0, language)}% ${t('average score')}`} tone="orange" language={language} />
            </section>

            <section className="panel-grid two-col">
              <div className="panel-card">
                <div className="panel-header">
                  <div><h3>{t('Campaign investment')}</h3><p>{t('Planned budget across campaigns')}</p></div>
                  <span className="panel-highlight">{formatCurrency(dashboard.stats.totalBudget ?? totalBudget, language)}</span>
                </div>
                <div className="chart-box">
                  {dashboard.chartData?.length ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={dashboard.chartData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 5" stroke="var(--chart-grid)" />
                        <XAxis dataKey="name" stroke="var(--chart-label)" axisLine={false} tickLine={false} />
                        <YAxis stroke="var(--chart-label)" axisLine={false} tickLine={false} />
                        <Tooltip formatter={(value) => formatCurrency(value, language)} />
                        <Bar dataKey="budget" fill="var(--primary)" radius={[7, 7, 2, 2]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="empty-state"><span>▤</span><strong>{t('No campaigns yet')}</strong><p>{t('Create a campaign to see planned investment here.')}</p><button className="text-button" onClick={() => setActiveTab('Campaigns')}>{t('Create a campaign')} <span>→</span></button></div>}
                </div>
              </div>

              <div className="panel-card">
                <div className="panel-header">
                  <h3>{t('Recent AI activity')}</h3>
                  <span className="subtle-label">{t('Latest')}</span>
                </div>
                <div className="feed-list">
                  {(dashboard.activities ?? activityFeed).slice(0, 5).map((item) => (
                    <div key={item.id || `${item.agent_name}-${item.created_at}`} className="feed-item">
                      <span className="activity-avatar">✦</span>
                      <div><strong>{t(item.agent_name)}</strong><span>{item.output_text || item.model_name}</span></div>
                    </div>
                  ))}
                  {!dashboard.activities?.length && !activityFeed.length ? <div className="empty-state compact"><strong>{t('No AI activity yet')}</strong><p>{t('Run an agent brief to see results here.')}</p></div> : null}
                </div>
              </div>
            </section>

            <section className="panel-grid three-col">
              <div className="panel-card">
                <div className="panel-header">
                  <h3>{t('Upcoming tasks')}</h3>
                  <span className="count-pill">{formatNumber(dashboard.tasks?.length ?? 0, language)}</span>
                </div>
                <ul className="task-list">
                  {(dashboard.tasks ?? []).map((task) => (
                    <li key={task.id}>
                      <div>
                        <strong>{task.title}</strong>
                        <small>{task.client}</small>
                      </div>
                      <span>{task.dueDate}</span>
                    </li>
                  ))}
                  {!dashboard.tasks?.length ? <li className="empty-inline">{t('No upcoming campaign deadlines.')}</li> : null}
                </ul>
              </div>

              <div className="panel-card">
                <div className="panel-header">
                  <h3>{t('Lead pipeline')}</h3>
                  <span className="count-pill">{formatNumber(dashboard.leads?.length ?? 0, language)}</span>
                </div>
                <div className="mini-chart">
                  {dashboard.leads?.length ? <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={dashboard.leads?.slice(0, 5).map((lead) => ({ name: lead.name, score: lead.score })) || []}>
                      <defs>
                        <linearGradient id="fillScore" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="5%" stopColor="var(--cyan)" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="var(--cyan)" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="var(--chart-label)" axisLine={false} tickLine={false} />
                      <YAxis stroke="var(--chart-label)" axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="score" stroke="var(--cyan)" fill="url(#fillScore)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer> : <div className="empty-state compact"><strong>{t('No lead data yet')}</strong><p>{t('Lead performance will appear when you have records.')}</p></div>}
                </div>
              </div>

              <div className="panel-card">
                <div className="panel-header">
                  <div><h3>{t('Recent content')}</h3><p>{t('Drafts and published pieces')}</p></div>
                  <button className="text-button" onClick={() => setActiveTab('Content')}>{t('View all')} <span>→</span></button>
                </div>
                <ul className="report-list">
                  {contentItems.slice(0, 3).map((item) => <li key={item.id}><span className="content-type-icon">✳</span><div><strong>{item.title}</strong><span>{item.platform || item.type} · {item.status}</span></div></li>)}
                  {!contentItems.length ? <li className="empty-inline">{t('Your saved content will show here.')}</li> : null}
                </ul>
              </div>
            </section>
          </>
        ) : null}

        {activePage === 'clients' ? (
          <section className="panel-grid two-col">
            <div className="panel-card form-panel">
              <div className="panel-header">
                <h3>{t(clientForm.id ? 'Edit client' : 'Add client')}</h3>
              </div>
              <form onSubmit={handleClientSubmit} className="stacked-form">
                <input required minLength={2} maxLength={160} value={clientForm.name} onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })} placeholder={t('Business name')} />
                <div className="double-grid">
                  <input value={clientForm.industry} onChange={(e) => setClientForm({ ...clientForm, industry: e.target.value })} placeholder={t('Industry')} />
                  <input value={clientForm.website} onChange={(e) => setClientForm({ ...clientForm, website: e.target.value })} placeholder={t('Website')} />
                </div>
                <div className="double-grid">
                  <input value={clientForm.contact_name} onChange={(e) => setClientForm({ ...clientForm, contact_name: e.target.value })} placeholder={t('Contact name')} />
                  <input type="email" value={clientForm.contact_email} onChange={(e) => setClientForm({ ...clientForm, contact_email: e.target.value })} placeholder={t('Contact email')} />
                </div>
                <input value={clientForm.contact_phone} onChange={(e) => setClientForm({ ...clientForm, contact_phone: e.target.value })} placeholder={t('Phone')} />
                <textarea value={clientForm.target_audience} onChange={(e) => setClientForm({ ...clientForm, target_audience: e.target.value })} placeholder={t('Target audience')} rows="3" />
                <textarea value={clientForm.marketing_goals} onChange={(e) => setClientForm({ ...clientForm, marketing_goals: e.target.value })} placeholder={t('Marketing goals')} rows="3" />
                <div className="double-grid">
                  <select value={clientForm.preferred_language} onChange={(e) => setClientForm({ ...clientForm, preferred_language: e.target.value })}>
                    <option value="English">{t('English')}</option>
                    <option value="Bangla">{t('Bangla')}</option>
                    <option value="Bilingual">{t('Bilingual')}</option>
                  </select>
                  <select value={clientForm.status} onChange={(e) => setClientForm({ ...clientForm, status: e.target.value })}>
                    <option value="active">{t('Active')}</option>
                    <option value="paused">{t('Paused')}</option>
                    <option value="archived">{t('Archived')}</option>
                  </select>
                </div>
                <textarea value={clientForm.notes} onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })} placeholder={t('Notes')} rows="2" />
                <div className="form-actions">
                  <button type="submit" className="primary-btn">{t(clientForm.id ? 'Update client' : 'Save client')}</button>
                  <button type="button" className="secondary-btn" onClick={() => setClientForm(defaultClientForm)}>{t('Reset')}</button>
                </div>
              </form>
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <div><h3>{t('Client roster')}</h3><p>{formatNumber(filteredClients.length, language)} / {formatNumber(clients.length, language)}</p></div>
              </div>
              <div className="list-controls">
                <input type="search" value={clientSearch} onChange={(event) => setClientSearch(event.target.value)} placeholder={t('Search clients')} aria-label={t('Search clients')} />
                <select aria-label={t('Filter by status')} value={clientStatusFilter} onChange={(event) => setClientStatusFilter(event.target.value)}>
                  <option value="all">{t('All statuses')}</option>
                  <option value="active">{t('Active')}</option>
                  <option value="paused">{t('Paused')}</option>
                  <option value="archived">{t('Archived')}</option>
                </select>
              </div>
              <div className="table-list">
                {filteredClients.map((client) => (
                  <div key={client.id} className="table-row">
                    <div>
                      <strong>{client.name}</strong>
                      <small>{client.industry}</small>
                    </div>
                    <div>
                      <span className="badge">{t(client.status)}</span>
                    </div>
                    <div className="row-actions">
                      <button onClick={() => setClientForm(client)}>{t('Edit')}</button>
                      <button onClick={() => handleClientDelete(client.id)}>{t('Delete')}</button>
                    </div>
                  </div>
                ))}
                {!filteredClients.length ? <div className="empty-inline">{clients.length ? t('No clients match your search.') : t('No clients yet. Add your first client to get started.')}</div> : null}
              </div>
            </div>
          </section>
        ) : null}

        {activePage === 'campaigns' ? (
          <section className="panel-grid two-col">
            <div className="panel-card form-panel">
              <div className="panel-header">
                <h3>{t(campaignForm.id ? 'Edit campaign' : 'Create campaign')}</h3>
              </div>
              <form onSubmit={handleCampaignSubmit} className="stacked-form">
                <select required value={campaignForm.client_id} onChange={(e) => setCampaignForm({ ...campaignForm, client_id: Number(e.target.value) })}>
                  <option value="">{t('Select client')}</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
                <input required minLength={2} maxLength={160} value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} placeholder={t('Campaign title')} />
                <input value={campaignForm.objective} onChange={(e) => setCampaignForm({ ...campaignForm, objective: e.target.value })} placeholder={t('Objective')} />
                <input value={campaignForm.target_audience} onChange={(e) => setCampaignForm({ ...campaignForm, target_audience: e.target.value })} placeholder={t('Target audience')} />
                <input value={campaignForm.platforms} onChange={(e) => setCampaignForm({ ...campaignForm, platforms: e.target.value })} placeholder={t('Platforms (comma separated)')} />
                <div className="double-grid">
                  <input type="number" min="0" value={campaignForm.budget} onChange={(e) => setCampaignForm({ ...campaignForm, budget: Number(e.target.value) })} placeholder={t('Budget')} />
                  <select value={campaignForm.status} onChange={(e) => setCampaignForm({ ...campaignForm, status: e.target.value })}>
                    <option value="draft">{t('Draft')}</option>
                    <option value="active">{t('Active')}</option>
                    <option value="paused">{t('Paused')}</option>
                    <option value="archived">{t('Archived')}</option>
                  </select>
                </div>
                <div className="double-grid">
                  <input type="date" value={campaignForm.start_date} onChange={(e) => setCampaignForm({ ...campaignForm, start_date: e.target.value })} />
                  <input type="date" value={campaignForm.due_date} onChange={(e) => setCampaignForm({ ...campaignForm, due_date: e.target.value })} />
                </div>
                <textarea value={campaignForm.description} onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })} placeholder={t('Description')} rows="3" />
                <div className="form-actions">
                  <button type="submit" className="primary-btn">{t(campaignForm.id ? 'Update campaign' : 'Save campaign')}</button>
                  <button type="button" className="secondary-btn" onClick={() => setCampaignForm(defaultCampaignForm)}>{t('Reset')}</button>
                </div>
              </form>
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <div><h3>{t('Campaigns')}</h3><p>{formatNumber(filteredCampaigns.length, language)} / {formatNumber(campaigns.length, language)}</p></div>
              </div>
              <div className="list-controls">
                <input type="search" value={campaignSearch} onChange={(event) => setCampaignSearch(event.target.value)} placeholder={t('Search campaigns')} aria-label={t('Search campaigns')} />
                <select aria-label={t('Filter by status')} value={campaignStatusFilter} onChange={(event) => setCampaignStatusFilter(event.target.value)}>
                  <option value="all">{t('All statuses')}</option>
                  <option value="draft">{t('Draft')}</option>
                  <option value="active">{t('Active')}</option>
                  <option value="paused">{t('Paused')}</option>
                  <option value="archived">{t('Archived')}</option>
                </select>
              </div>
              <div className="table-list">
                {filteredCampaigns.map((campaign) => (
                  <div key={campaign.id} className="table-row campaign-row">
                    <div>
                      <strong>{campaign.name}</strong>
                      <small>{campaign.objective}</small>
                    </div>
                    <div>
                      <span className="badge">{t(campaign.status)}</span>
                      <span>{formatCurrency(campaign.budget, language)}</span>
                    </div>
                    <div className="row-actions">
                      <button onClick={() => setCampaignForm(campaign)}>{t('Edit')}</button>
                      <button onClick={() => handleCampaignAction('duplicate', campaign.id)}>{t('Duplicate')}</button>
                      <button onClick={() => handleCampaignAction(campaign.status === 'archived' ? 'unarchive' : 'archive', campaign.id)}>{t(campaign.status === 'archived' ? 'Unarchive' : 'Archive')}</button>
                      <button onClick={() => handleCampaignAction('delete', campaign.id)}>{t('Delete')}</button>
                    </div>
                  </div>
                ))}
                {!filteredCampaigns.length ? <div className="empty-inline">{campaigns.length ? t('No campaigns match your search.') : t('No campaigns yet. Create your first campaign to get started.')}</div> : null}
              </div>
            </div>
          </section>
        ) : null}

        {activePage === 'content' ? (
          <section className="panel-grid two-col">
            <div className="panel-card form-panel">
              <div className="panel-header">
                <h3>{t('Content studio')}</h3>
              </div>
              <form onSubmit={contentForm.id ? handleContentSave : handleContentGenerate} className="stacked-form">
                <select value={contentForm.client_id} onChange={(e) => setContentForm({ ...contentForm, client_id: e.target.value })}>
                  <option value="">{t('Select client')}</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
                <div className="double-grid">
                  <select value={contentForm.type} onChange={(e) => setContentForm({ ...contentForm, type: e.target.value })}>
                    <option value="post">{t('Social post')}</option>
                    <option value="ad_copy">{t('Ad copy')}</option>
                    <option value="email">{t('Email')}</option>
                    <option value="landing_page">{t('Landing page')}</option>
                    <option value="generated">{t('Generated content')}</option>
                  </select>
                  <select value={contentForm.platform} onChange={(e) => setContentForm({ ...contentForm, platform: e.target.value })}>
                    <option value="Instagram">{t('Instagram')}</option>
                    <option value="Facebook">{t('Facebook')}</option>
                    <option value="Google">{t('Google')}</option>
                    <option value="Email">{t('Email')}</option>
                  </select>
                </div>
                <div className="double-grid">
                  <select value={contentForm.tone} onChange={(e) => setContentForm({ ...contentForm, tone: e.target.value })}>
                    <option value="professional">{t('Professional')}</option>
                    <option value="friendly">{t('Friendly')}</option>
                    <option value="persuasive">{t('Persuasive')}</option>
                    <option value="conversational">{t('Conversational')}</option>
                  </select>
                  <select value={contentForm.language} onChange={(e) => setContentForm({ ...contentForm, language: e.target.value })}>
                    <option value="English">{t('English')}</option>
                    <option value="Bangla">{t('Bangla')}</option>
                    <option value="Bilingual">{t('Bilingual')}</option>
                  </select>
                </div>
                <input required minLength={2} value={contentForm.title} onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })} placeholder={t('Campaign title or content brief')} />
                <textarea required minLength={3} value={contentForm.body} onChange={(e) => setContentForm({ ...contentForm, body: e.target.value })} placeholder={t('Describe the message, audience, offer, and CTA')} rows="5" />
                <div className="form-actions">
                  {contentForm.id ? (
                    <>
                      <button type="submit" className="primary-btn">{t('Save changes')}</button>
                      <button type="button" className="secondary-btn" onClick={() => setContentForm(defaultContentForm)}>{t('Cancel editing')}</button>
                    </>
                  ) : <button type="submit" className="primary-btn" disabled={aiBusy}>{aiBusy ? `${t('Generating')}...` : t('Generate content')}</button>}
                </div>
              </form>
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <div><h3>{t('Generated library')}</h3><p>{formatNumber(filteredContentItems.length, language)} / {formatNumber(contentItems.length, language)}</p></div>
              </div>
              <div className="list-controls">
                <input type="search" value={contentSearch} onChange={(event) => setContentSearch(event.target.value)} placeholder={t('Search content')} aria-label={t('Search content')} />
                <select aria-label={t('Filter by status')} value={contentStatusFilter} onChange={(event) => setContentStatusFilter(event.target.value)}>
                  <option value="all">{t('All statuses')}</option>
                  <option value="draft">{t('Draft')}</option>
                  <option value="published">{t('Published')}</option>
                </select>
              </div>
              <div className="table-list">
                {filteredContentItems.map((item) => (
                  <div key={item.id} className="table-row content-row">
                    <div>
                      <strong>{item.title}</strong>
                      <small>{t(item.type)} · {t(item.platform)}</small>
                    </div>
                    <span className="badge">{t(item.status)}</span>
                    <div className="row-actions">
                      <button onClick={() => handleContentEdit(item)}>{t('Edit')}</button>
                      <button onClick={() => handleCopyContent(item.body)}>{t('Copy text')}</button>
                      <button onClick={() => handleContentDelete(item.id)}>{t('Delete')}</button>
                    </div>
                  </div>
                ))}
                {!filteredContentItems.length ? <div className="empty-inline">{contentItems.length ? t('No content matches your search.') : t('No content saved yet. Generate your first piece to get started.')}</div> : null}
              </div>
            </div>
          </section>
        ) : null}

        {activePage === 'ai' ? (
          <section className="panel-grid two-col">
            <div className="panel-card form-panel">
              <div className="panel-header">
                <h3>{t('Multi-agent workflow')}</h3>
              </div>
              <form onSubmit={handleAiGenerate} className="stacked-form">
                <select value={aiForm.agent} onChange={(e) => setAiForm({ ...aiForm, agent: e.target.value })}>
                  {['AI Marketing Strategist', 'AI Content Creator', 'AI SEO Agent', 'AI Advertising Agent', 'AI Social Media Manager', 'AI Marketing Analyst', 'AI Customer Acquisition Agent'].map((agent) => (
                    <option key={agent} value={agent}>{t(agent)}</option>
                  ))}
                </select>
                <select value={aiForm.model} onChange={(e) => setAiForm({ ...aiForm, model: e.target.value })}>
                  {models.length ? models.map((model) => <option key={model} value={model}>{model}</option>) : <option value="" disabled>{t('No Ollama models are available. Start Ollama and pull a model.')}</option>}
                </select>
                <textarea value={aiForm.prompt} onChange={(e) => setAiForm({ ...aiForm, prompt: e.target.value })} placeholder={t('Describe your marketing objective, target audience, product, and output requirements')} rows="8" />
                <div className="double-grid">
                  <input type="number" min="0" max="1" step="0.1" value={aiForm.temperature} onChange={(e) => setAiForm({ ...aiForm, temperature: Number(e.target.value) })} />
                  <input type="number" min="50" max="2000" step="50" value={aiForm.maxTokens} onChange={(e) => setAiForm({ ...aiForm, maxTokens: Number(e.target.value) })} />
                </div>
                <div className="form-actions">
                  <button type="submit" className="primary-btn" disabled={aiBusy || !models.length || aiForm.prompt.trim().length < 5}>{aiBusy ? `${t('Generating')}...` : t('Run agent')}</button>
                </div>
              </form>
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <h3>{t('Agent output')}</h3>
              </div>
              <div className="output-box">
                {aiOutput ? <pre>{aiOutput}</pre> : <p>{t('No output yet. Use the agent to generate a recommendation.')}</p>}
              </div>
            </div>
          </section>
        ) : null}

        {activePage === 'analytics' ? (
          <section className="panel-grid two-col">
            <div className="panel-card form-panel">
              <div className="panel-header">
                <h3>{t('Upload campaign CSV')}</h3>
              </div>
              <label className="file-picker">
                <span>{t('Choose CSV file')}</span>
                <input
                  type="file"
                  accept=".csv"
                  aria-label={t('Choose CSV file')}
                  disabled={analyticsBusy}
                  onChange={handleCsvUpload}
                />
              </label>
              {analyticsBusy ? <p className="loading-state">{t('Importing CSV…')}</p> : null}
              {dashboard.analytics ? (
                <div className="analytics-summary">
                    <div><strong>{t('Total spend:')}</strong> {dashboard.analytics.summary.totalSpend === null ? '—' : formatCurrency(dashboard.analytics.summary.totalSpend, language)}</div>
                    <div><strong>{t('Total leads:')}</strong> {dashboard.analytics.summary.totalLeads === null ? '—' : formatNumber(dashboard.analytics.summary.totalLeads, language)}</div>
                    <div><strong>{t('Average CTR:')}</strong> {dashboard.analytics.summary.avgCtr === null ? '—' : `${dashboard.analytics.summary.avgCtr}%`}</div>
                </div>
              ) : null}
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <h3>{t('Performance insights')}</h3>
              </div>
              <div className="table-list">
                {(dashboard.analytics?.metrics || []).slice(0, 6).map((item, index) => (
                  <div key={`${item.campaign}-${index}`} className="table-row">
                    <div>
                      <strong>{item.campaign}</strong>
                      <small>{item.leads} {t('leads')}</small>
                    </div>
                    <div>
                      <strong>{item.ctr === null ? '—' : `${item.ctr}%`}</strong>
                      <small>CTR</small>
                    </div>
                    <div>
                      <strong>{item.cpl === null ? '—' : formatCurrency(item.cpl, language)}</strong>
                      <small>CPL</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {!dashboard.analytics?.metrics?.length && activePage === 'analytics' ? <div className="empty-inline">{t('No analytics data yet. Choose a campaign CSV to calculate available metrics.')}</div> : null}
        {loading ? <div className="loading-state">{t('Loading platform data…')}</div> : null}
      </main>
    </div>
  );
}
