import React, { useState } from 'react';
import { toast } from 'sonner';
import RoleSelector from './RoleSelector';
import FormField from '@/components/ui/FormField';
import PasswordInput from './PasswordInput';
import { supabase } from '@/integrations/supabase/client';

type Role = 'student' | 'teacher';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return false;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      setIsLoading(true);
      
      try {
        // Register the user with Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              user_type: role
            }
          }
        });
        
        if (authError) {
          toast.error(authError.message);
          console.error('Registration error:', authError);
          return;
        }

        if (!authData.user) {
          toast.error('Failed to create user');
          return;
        }

        // Create profile for the user
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            first_name: firstName,
            last_name: lastName,
            user_type: role,
            created_at: new Date().toISOString()
          });

        if (profileError) {
          toast.error('Failed to create profile');
          console.error('Profile creation error:', profileError);
          return;
        }

        toast.success(`Successfully registered as ${role === 'student' ? 'Student' : 'Teacher'}`);
        console.log('Registration successful:', authData);
        
        // Reset form
        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        
        // Switch to login after successful registration
        onSwitchToLogin();
      } catch (err) {
        console.error('Unexpected error during registration:', err);
        toast.error('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="First Name"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <FormField
            label="Last Name"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <FormField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <PasswordInput
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <PasswordInput
          label="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      <RoleSelector
        selectedRole={role}
        onRoleChange={setRole}
      />
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-edu-blue text-white py-2 px-4 rounded-md hover:bg-edu-blue/90 disabled:opacity-50"
      >
        {isLoading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
};

export default RegisterForm;
