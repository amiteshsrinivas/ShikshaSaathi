
import React, { useState } from 'react';
import LoginForm from '@/components/AuthForms/LoginForm';
import RegisterForm from '@/components/AuthForms/RegisterForm';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const Index = () => {
  const [isLogin, setIsLogin] = useState(true);
  
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 px-4">
      <div className="w-full max-w-md mx-auto relative z-10">
        {/* Logo and Branding with enhanced styling */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4 shadow-lg shadow-primary/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary animate-pulse"
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
            </svg>
          </div>
          <motion.h1 
            className="text-4xl font-bold text-gray-900 drop-shadow-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Shiksha Saathi
          </motion.h1>
          <motion.p 
            className="text-gray-600 mt-2 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Your Learning Companion
          </motion.p>
        </motion.div>
        
        {/* Auth Card with enhanced styling */}
        <motion.div 
          className="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl p-8 border border-white/20"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="relative w-full overflow-hidden">
            <div 
              className={cn(
                "transition-all duration-500 transform",
                isLogin ? "translate-x-0 opacity-100" : "translate-x-[100px] opacity-0 absolute"
              )}
            >
              {isLogin && <LoginForm onSwitchToRegister={() => setIsLogin(false)} />}
            </div>
            
            <div
              className={cn(
                "transition-all duration-500 transform",
                !isLogin ? "translate-x-0 opacity-100" : "translate-x-[-100px] opacity-0 absolute"
              )}
            >
              {!isLogin && <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />}
            </div>
          </div>
        </motion.div>
        
        {/* Decorative elements */}
        <div className="absolute top-[-50px] right-[-80px] w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-[-30px] left-[-60px] w-72 h-72 bg-purple-500/10 rounded-full blur-3xl -z-10"></div>
        
        <motion.footer 
          className="mt-8 text-center text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          &copy; {new Date().getFullYear()} Shiksha Saathi. All rights reserved.
        </motion.footer>
      </div>
    </div>
  );
};

export default Index;
