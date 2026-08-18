import React from 'react';
import { WiiLogo } from './common/WiiLogo';
import {
  ExternalLink,
  ShieldCheck,
  Mail,
  MapPin,
  PhoneCall,
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-auto overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4 text-center md:text-left">
          {/* Brand & Institution Info */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="bg-white p-1.5 rounded-lg border border-slate-700 shrink-0">
              <WiiLogo size="sm" />
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5">
                <span className="font-bold text-slate-100 text-xs sm:text-sm">
                  Wildlife Institute of India
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-medium">
                  MoEFCC
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                Chandrabani, Dehradun, Uttarakhand - 248001
              </p>
            </div>
          </div>

          {/* Quick Links & Contact */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-4 gap-y-2 text-[11px]">
            <a
              href="https://wii.gov.in"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              <span>WII Portal</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
            <a
              href="https://mail.wii.gov.in"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              <Mail className="w-3 h-3 text-slate-500" />
              <span>Webmail</span>
            </a>
            <div className="flex items-center gap-1 text-slate-400">
              <PhoneCall className="w-3 h-3 text-slate-500" />
              <span>IT Cell: Ext 138</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[10px] sm:text-[11px] text-slate-500 text-center sm:text-left">
          <div>
            © {new Date().getFullYear()} Wildlife Institute of India. All rights reserved.
          </div>
          <div className="flex items-center gap-2.5 text-[10px]">
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
              NIC & MoEFCC Cyber Compliant
            </span>
            <span>•</span>
            <span>v3.2.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};


