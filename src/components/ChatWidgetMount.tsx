import React, { useEffect, useState } from 'react';
import { ChatWidget } from './ChatWidget';
import { UserType } from '../chat/type';
import { getToken, getUserType } from '../services/auth';

const HIDDEN_ROUTES = new Set([
  'Home',
  'Login',
  'Cadastro',
  'EsqueceuSenha',
  'RedefinicaoSenha',
  'MapaProf',
]);

type Props = { routeName?: string };

type AuthState =
  | { status: 'checking' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; userType: UserType };

export function ChatWidgetMount({ routeName }: Props) {
  const [auth, setAuth] = useState<AuthState>({ status: 'checking' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [token, rawType] = await Promise.all([getToken(), getUserType()]);
      if (cancelled) return;
      if (!token) {
        setAuth({ status: 'anonymous' });
        return;
      }
      const normalized = String(rawType || '').toUpperCase();
      const userType: UserType =
        normalized === 'PROFESSIONAL' ? 'PROFESSIONAL' : 'CLIENT';
      setAuth({ status: 'authenticated', userType });
    })();
    return () => {
      cancelled = true;
    };
  }, [routeName]);

  if (auth.status !== 'authenticated') return null;
  if (!routeName || HIDDEN_ROUTES.has(routeName)) return null;

  return <ChatWidget userType={auth.userType} />;
}
