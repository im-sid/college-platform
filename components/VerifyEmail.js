import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, sendEmailVerification } from 'firebase/auth';

const VerifyEmail = () => {
  const [message, setMessage] = useState('Please verify your email. Check your inbox for the verification link.');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.emailVerified) {
          // If email is verified, redirect to login
          navigate('/auth', { replace: true });
        }
      } else {
        // If no user is logged in, redirect to login
        navigate('/auth', { replace: true });
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  const handleResendEmail = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        setMessage('A new verification email has been sent. Check your inbox.');
      } else {
        setMessage('No user is logged in. Please log in to resend the verification email.');
        navigate('/auth', { replace: true });
      }
    } catch (err) {
      console.error('Error resending verification email:', err);
      setMessage('Error resending verification email. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>Email Verification</h2>
      <p>{message}</p>
      <button onClick={handleResendEmail} disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Resend Verification Email'}
      </button>
    </div>
  );
};

export default VerifyEmail;