import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Globe, 
  Bookmark, 
  Cpu, 
  X, 
  Check, 
  Search, 
  Trash2, 
  CheckCircle, 
  ExternalLink, 
  Plus,
  HeartHandshake,
  Network
} from 'lucide-react';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, category?: any) => void;
}

export const SaveNewContentModal: React.FC<SaveModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), description.trim());
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-50">Save as New Content Guideline</h3>
              <p className="text-[11px] text-slate-400">Save current tone, readability, and formatting as a reusable preset</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-50 p-1 rounded-lg hover:bg-slate-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Guideline Name *</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Enterprise BLUF & Direct Tone, Medical Strict YMYL"
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Clear customer-first voice with short paragraphs for B2B documentation"
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-50 text-xs font-semibold rounded-xl hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 shadow-lg cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Content Guideline</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const SaveNewSeoModal: React.FC<SaveModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), description.trim());
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-50">Save as New SEO Guideline</h3>
              <p className="text-[11px] text-slate-400">Save current technical SEO, Schema, and meta rules as a reusable preset</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-50 p-1 rounded-lg hover:bg-slate-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Guideline Name *</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Master Technical SEO Playbook, E-Commerce Schema Standard"
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Strict 50-60 character titles, SoftwareApplication Schema, and clean canonical rules"
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-50 text-xs font-semibold rounded-xl hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 shadow-lg cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save SEO Guideline</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const SaveNewGeoModal: React.FC<SaveModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), description.trim());
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-50">Save as New GEO Guideline</h3>
              <p className="text-[11px] text-slate-400">Save generative engine optimization, citation, and AI overview rules</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-50 p-1 rounded-lg hover:bg-slate-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Guideline Name *</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Master GEO & AI Overview Playbook, Perplexity Citation Focus"
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. BLUF answer blocks, quantitative comparison matrices, and multi-source verified citations"
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-50 text-xs font-semibold rounded-xl hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 shadow-lg cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save GEO Guideline</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const SaveNewProductModal: React.FC<SaveModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'b2b_saas' | 'fintech' | 'ecommerce' | 'healthcare' | 'custom'>('b2b_saas');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), description.trim(), category);
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-50">Save as New Product Guideline</h3>
              <p className="text-[11px] text-slate-400">Save current product details, USPs, and compliance rules as a reusable preset</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-50 p-1 rounded-lg hover:bg-slate-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Product / Profile Name *</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ApexFlow Cloud Platform, NovaPay Gateway"
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="b2b_saas">B2B SaaS & Enterprise Software</option>
              <option value="fintech">Fintech & Banking</option>
              <option value="ecommerce">E-Commerce & Consumer</option>
              <option value="healthcare">Healthcare & MedTech</option>
              <option value="custom">General / Custom</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Enterprise compliance, ISO-certified automated workflows"
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-50 text-xs font-semibold rounded-xl hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 shadow-lg cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Product Guideline</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const SaveNewCustomerCentricityModal: React.FC<SaveModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('financial_ymyl');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), description.trim(), category);
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-50">Save as New Customer Centricity Guideline</h3>
              <p className="text-[11px] text-slate-400">Save current customer persona, friction rules, and reading constraints (Agent 5)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-50 p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Preset Name *</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Empathetic Lending Standard, Enterprise Buyer Low-Friction"
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-rose-500 focus:outline-none"
            >
              <option value="financial_ymyl">FinTech / YMYL High-Trust</option>
              <option value="b2b_enterprise">B2B Enterprise Decision Makers</option>
              <option value="ecommerce">D2C E-Commerce & Shoppers</option>
              <option value="healthcare">Healthcare & Patient Care</option>
              <option value="custom">General / Custom</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 8th-grade reading level, proactive objection handling, and zero hidden fee friction"
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-50 text-xs font-semibold rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 shadow-lg cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Customer Centricity Preset</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const SaveNewStructureMappingModal: React.FC<SaveModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('voice_aeo');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), description.trim(), category);
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-50">Save as New Structure & Keyword Mapping Guideline</h3>
              <p className="text-[11px] text-slate-400">Save current heading hierarchy, H1 rules, and intent mapping rules (Agent 4)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-50 p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Preset Name *</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. High-Volume Commercial & Voice AEO Architecture"
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            >
              <option value="voice_aeo">Voice Search & AEO Question Architecture</option>
              <option value="enterprise">Topical Authority & Matrix Architecture</option>
              <option value="conversion">Conversion Landing Page Architecture</option>
              <option value="custom">General / Custom</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Strict single H1, 40% question headings, and 2 occurrences minimum keyword mapping"
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-50 text-xs font-semibold rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 shadow-lg cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Structure Guideline Preset</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export interface PresetItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  isBuiltIn?: boolean;
  createdAt?: string;
}

export interface PresetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  type: 'content' | 'seo' | 'geo' | 'product' | 'customer' | 'structure';
  activePresetId?: string;
  presets: PresetItem[];
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
  onOpenSaveNew: () => void;
}

export const PresetManagerModal: React.FC<PresetManagerModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  type,
  activePresetId,
  presets,
  onSelect,
  onDelete,
  onOpenSaveNew
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPresets = useMemo(() => {
    if (!searchTerm.trim()) return presets;
    const q = searchTerm.toLowerCase();
    return presets.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.description && p.description.toLowerCase().includes(q))
    );
  }, [presets, searchTerm]);

  if (!isOpen) return null;

  const typeConfig = {
    content: {
      color: 'purple',
      badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      activeBtnClass: 'bg-purple-600 hover:bg-purple-500 text-white',
      icon: Sparkles
    },
    seo: {
      color: 'blue',
      badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      activeBtnClass: 'bg-blue-600 hover:bg-blue-500 text-white',
      icon: Globe
    },
    geo: {
      color: 'emerald',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      activeBtnClass: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      icon: Cpu
    },
    product: {
      color: 'indigo',
      badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      activeBtnClass: 'bg-indigo-600 hover:bg-indigo-500 text-white',
      icon: Bookmark
    },
    customer: {
      color: 'rose',
      badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      activeBtnClass: 'bg-rose-600 hover:bg-rose-500 text-white',
      icon: HeartHandshake
    },
    structure: {
      color: 'amber',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      activeBtnClass: 'bg-amber-600 hover:bg-amber-500 text-white',
      icon: Network
    }
  }[type];

  const Icon = typeConfig.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border ${typeConfig.badgeClass}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-50">{title}</h3>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-50 p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search presets by name or keywords..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-700"
            />
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenSaveNew();
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save Current as New</span>
          </button>
        </div>

        {/* List of presets */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {filteredPresets.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No presets match your search.
            </div>
          ) : (
            filteredPresets.map((preset) => {
              const isActive = preset.id === activePresetId;
              return (
                <div
                  key={preset.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isActive 
                      ? 'bg-slate-800/80 border-slate-600 shadow-md ring-1 ring-slate-600' 
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-bold text-sm text-slate-50">{preset.name}</span>
                        {preset.isBuiltIn ? (
                          <span className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                            Built-in
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Custom Saved
                          </span>
                        )}
                        {isActive && (
                          <span className="flex items-center space-x-1 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <CheckCircle className="w-3 h-3" />
                            <span>Currently Active</span>
                          </span>
                        )}
                      </div>
                      {preset.description && (
                        <p className="text-xs text-slate-400 leading-relaxed">{preset.description}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {isActive ? (
                        <button
                          disabled
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 flex items-center space-x-1 cursor-default opacity-80"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onSelect(preset.id);
                            onClose();
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer shadow-sm ${typeConfig.activeBtnClass}`}
                        >
                          <span>Select & Apply</span>
                        </button>
                      )}

                      {!preset.isBuiltIn && onDelete && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete custom preset "${preset.name}"?`)) {
                              onDelete(preset.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer border border-transparent hover:border-red-500/20"
                          title="Delete Preset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center text-xs text-slate-400">
          <span>{filteredPresets.length} preset{filteredPresets.length === 1 ? '' : 's'} available</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
