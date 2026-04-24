import React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  variant?: 'income' | 'expense' | 'default';
}

export function Modal({ isOpen, onClose, title, children, variant = 'default' }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-slate-900 rounded-t-[40px] p-8 pb-12 z-50 shadow-2xl max-w-lg mx-auto"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className={ `text-2xl font-black uppercase tracking-tighter ${
                variant === 'income' ? 'text-emerald-400' : 
                variant === 'expense' ? 'text-rose-400' : 'text-white'
              }` }>
                {title}
              </h3>
              <button 
                onClick={onClose}
                className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
