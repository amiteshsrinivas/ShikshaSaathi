
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type Role = 'student' | 'teacher';

interface RoleSelectorProps {
  selectedRole: Role;
  onSelectRole: (role: Role) => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ 
  selectedRole, 
  onSelectRole 
}) => {
  return (
    <div className="flex items-center gap-3 p-1 bg-muted/50 rounded-lg mb-6">
      <motion.button
        type="button"
        onClick={() => onSelectRole('student')}
        className={cn(
          "flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all relative",
          selectedRole === 'student' 
            ? "text-primary-foreground" 
            : "text-muted-foreground hover:text-foreground"
        )}
        whileTap={{ scale: 0.95 }}
      >
        {selectedRole === 'student' && (
          <motion.div
            className="absolute inset-0 bg-primary rounded-md -z-10"
            layoutId="roleSelectorBg"
            transition={{ type: "spring", duration: 0.5 }}
          />
        )}
        <span className="relative z-10">Student</span>
      </motion.button>

      <motion.button
        type="button"
        onClick={() => onSelectRole('teacher')}
        className={cn(
          "flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all relative",
          selectedRole === 'teacher' 
            ? "text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        whileTap={{ scale: 0.95 }}
      >
        {selectedRole === 'teacher' && (
          <motion.div
            className="absolute inset-0 bg-primary rounded-md -z-10"
            layoutId="roleSelectorBg"
            transition={{ type: "spring", duration: 0.5 }}
          />
        )}
        <span className="relative z-10">Teacher</span>
      </motion.button>
    </div>
  );
};

export default RoleSelector;
