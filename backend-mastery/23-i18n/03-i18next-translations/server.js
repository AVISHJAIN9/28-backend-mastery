import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import winston from 'winston';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 5403;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

app.use(helmet());
app.use(cors());
app.use(express.json());

const translations = {
  en: {
    greeting: 'Hello',
    welcome: 'Welcome to our application',
    login: 'Log in',
    logout: 'Log out',
    signup: 'Sign up',
    items: 'You have {{count}} item',
    items_plural: 'You have {{count}} items',
    emailSent: 'Email sent to {{email}}',
    auth: {
      login: 'Log In',
      register: 'Create Account',
      forgotPassword: 'Forgot Password',
      forms: {
        email: 'Email Address',
        password: 'Password',
        confirmPassword: 'Confirm Password'
      }
    },
    checkout: {
      pay: 'Pay',
      shipping: 'Shipping',
      total: 'Total',
      items: 'Items in cart'
    }
  },
  es: {
    greeting: 'Hola',
    welcome: 'Bienvenido a nuestra aplicación',
    login: 'Iniciar sesión',
    logout: 'Cerrar sesión',
    signup: 'Registrarse',
    items: 'Tienes {{count}} artículo',
    items_plural: 'Tienes {{count}} artículos',
    emailSent: 'Email enviado a {{email}}',
    auth: {
      login: 'Iniciar Sesión',
      register: 'Crear Cuenta',
      forgotPassword: 'Olvidé mi Contraseña',
      forms: {
        email: 'Dirección de Email',
        password: 'Contraseña',
        confirmPassword: 'Confirmar Contraseña'
      }
    },
    checkout: {
      pay: 'Pagar',
      shipping: 'Envío',
      total: 'Total',
      items: 'Artículos en carrito'
    }
  },
  fr: {
    greeting: 'Bonjour',
    welcome: 'Bienvenue dans notre application',
    login: 'Se connecter',
    logout: 'Se déconnecter',
    signup: 'S\'inscrire',
    items: 'Vous avez {{count}} article',
    items_plural: 'Vous avez {{count}} articles',
    emailSent: 'Email envoyé à {{email}}',
    auth: {
      login: 'Connexion',
      register: 'Créer un Compte',
      forgotPassword: 'Mot de passe oublié',
      forms: {
        email: 'Adresse Email',
        password: 'Mot de passe',
        confirmPassword: 'Confirmer le mot de passe'
      }
    },
    checkout: {
      pay: 'Payer',
      shipping: 'Livraison',
      total: 'Total',
      items: 'Articles au panier'
    }
  },
  de: {
    greeting: 'Hallo',
    welcome: 'Willkommen in unserer Anwendung',
    login: 'Anmelden',
    logout: 'Abmelden',
    signup: 'Registrieren',
    items: 'Du hast {{count}} Element',
    items_plural: 'Du hast {{count}} Elemente',
    emailSent: 'Email an {{email}} gesendet',
    auth: {
      login: 'Anmelden',
      register: 'Konto Erstellen',
      forgotPassword: 'Passwort Vergessen',
      forms: {
        email: 'Email-Adresse',
        password: 'Passwort',
        confirmPassword: 'Passwort Bestätigen'
      }
    },
    checkout: {
      pay: 'Bezahlen',
      shipping: 'Versand',
      total: 'Gesamt',
      items: 'Artikel im Warenkorb'
    }
  },
  ja: {
    greeting: 'こんにちは',
    welcome: 'アプリケーションへようこそ',
    login: 'ログイン',
    logout: 'ログアウト',
    signup: 'サインアップ',
    items: '{{count}}個のアイテムがあります',
    items_plural: '{{count}}個のアイテムがあります',
    emailSent: '{{email}}にメールを送信しました',
    auth: {
      login: 'ログイン',
      register: 'アカウント作成',
      forgotPassword: 'パスワードをお忘れですか',
      forms: {
        email: 'メールアドレス',
        password: 'パスワード',
        confirmPassword: 'パスワード確認'
      }
    },
    checkout: {
      pay: '支払う',
      shipping: '配送',
      total: '合計',
      items: 'かごの中のアイテム'
    }
  },
  ar: {
    greeting: 'مرحبا',
    welcome: 'أهلا وسهلا بك في تطبيقنا',
    login: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
    signup: 'إنشاء حساب',
    items: 'لديك {{count}} عنصر',
    items_plural: 'لديك {{count}} عنصر',
    emailSent: 'تم إرسال البريد الإلكتروني إلى {{email}}',
    auth: {
      login: 'تسجيل الدخول',
      register: 'إنشاء حساب',
      forgotPassword: 'هل نسيت كلمة المرور',
      forms: {
        email: 'عنوان البريد الإلكتروني',
        password: 'كلمة المرور',
        confirmPassword: 'تأكيد كلمة المرور'
      }
    },
    checkout: {
      pay: 'دفع',
      shipping: 'الشحن',
      total: 'المجموع',
      items: 'العناصر في السلة'
    }
  },
  pt: {
    greeting: 'Olá',
    welcome: 'Bem-vindo ao nosso aplicativo',
    login: 'Fazer login',
    logout: 'Fazer logout',
    signup: 'Inscrever-se',
    items: 'Você tem {{count}} item',
    items_plural: 'Você tem {{count}} itens',
    emailSent: 'Email enviado para {{email}}',
    auth: {
      login: 'Login',
      register: 'Criar Conta',
      forgotPassword: 'Esqueceu a Senha',
      forms: {
        email: 'Endereço de Email',
        password: 'Senha',
        confirmPassword: 'Confirmar Senha'
      }
    },
    checkout: {
      pay: 'Pagar',
      shipping: 'Envio',
      total: 'Total',
      items: 'Itens no carrinho'
    }
  }
};

function translate(languageCode, key, data = {}) {
  const lang = translations[languageCode] || translations['en'];
  const keys = key.split('.');
  let value = lang;
  
  for (const k of keys) {
    value = value[k];
    if (value === undefined) return key;
  }
  
  if (typeof value === 'string' && data.count !== undefined) {
    if (data.count === 1 && lang[key] !== undefined) {
      value = lang[key];
    } else if (data.count > 1) {
      const pluralKey = key + '_plural';
      value = lang[pluralKey] || value;
    }
  }
  
  Object.keys(data).forEach(placeholder => {
    value = value.replace(`{{${placeholder}}}`, data[placeholder]);
  });
  
  return value;
}

app.get('/api/translate', (req, res) => {
  try {
    const { language = 'en', key, ...data } = req.query;
    
    if (!key) {
      return res.status(400).json({ error: 'Missing key parameter' });
    }
    
    if (!translations[language]) {
      return res.status(400).json({ error: `Unsupported language: ${language}` });
    }
    
    const count = data.count ? parseInt(data.count) : undefined;
    const interpolationData = { ...data, ...(count !== undefined && { count }) };
    
    const result = translate(language, key, interpolationData);
    
    res.json({
      language,
      key,
      result,
      data: interpolationData
    });
  } catch (err) {
    logger.error('Translation error:', err);
    res.status(500).json({ error: 'Translation failed' });
  }
});

app.get('/api/translate/multiple', (req, res) => {
  try {
    const { language = 'en', keys = '' } = req.query;
    
    if (!keys) {
      return res.status(400).json({ error: 'Missing keys parameter (comma-separated)' });
    }
    
    if (!translations[language]) {
      return res.status(400).json({ error: `Unsupported language: ${language}` });
    }
    
    const keyList = keys.split(',');
    const results = {};
    
    keyList.forEach(key => {
      results[key] = translate(language, key);
    });
    
    res.json({
      language,
      translations: results
    });
  } catch (err) {
    logger.error('Multiple translation error:', err);
    res.status(500).json({ error: 'Translation failed' });
  }
});

app.get('/api/translate/interpolate', (req, res) => {
  try {
    const { language = 'en', key, ...variables } = req.query;
    
    if (!key) {
      return res.status(400).json({ error: 'Missing key parameter' });
    }
    
    if (!translations[language]) {
      return res.status(400).json({ error: `Unsupported language: ${language}` });
    }
    
    const result = translate(language, key, variables);
    
    res.json({
      language,
      key,
      variables,
      result
    });
  } catch (err) {
    logger.error('Interpolation error:', err);
    res.status(500).json({ error: 'Interpolation failed' });
  }
});

app.get('/api/languages', (req, res) => {
  const languages = {
    en: 'English',
    es: 'Spanish (Español)',
    fr: 'French (Français)',
    de: 'German (Deutsch)',
    ja: 'Japanese (日本語)',
    ar: 'Arabic (العربية)',
    pt: 'Portuguese (Português)'
  };
  
  const supported = Object.keys(translations).map(code => ({
    code,
    name: languages[code] || code,
    direction: code === 'ar' ? 'rtl' : 'ltr'
  }));
  
  res.json({
    total: supported.length,
    languages: supported
  });
});

app.get('/api/namespaces', (req, res) => {
  const enTranslations = translations['en'];
  const namespaces = Object.keys(enTranslations).filter(k => typeof enTranslations[k] === 'object');
  
  res.json({
    global: Object.keys(enTranslations).filter(k => typeof enTranslations[k] === 'string'),
    namespaces: namespaces,
    example: {
      global: 'greeting, welcome, login, logout',
      namespaced: 'auth.login, checkout.pay'
    }
  });
});

app.post('/api/translate/batch', (req, res) => {
  try {
    const { requests } = req.body;
    
    if (!Array.isArray(requests)) {
      return res.status(400).json({ error: 'Requests must be an array' });
    }
    
    const results = requests.map(req => ({
      ...req,
      result: translate(req.language || 'en', req.key, req.data || {})
    }));
    
    res.json({
      total: results.length,
      results
    });
  } catch (err) {
    logger.error('Batch translation error:', err);
    res.status(500).json({ error: 'Batch translation failed' });
  }
});

app.get('/api/translation-file/:language', (req, res) => {
  const { language } = req.params;
  
  if (!translations[language]) {
    return res.status(404).json({ error: `Language not found: ${language}` });
  }
  
  res.json({
    language,
    translations: translations[language],
    keys: Object.keys(translations[language]).length
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    languages: Object.keys(translations),
    module: 'Module 23.3: i18next Translations'
  });
});

app.use((err, req, res, next) => {
  logger.error('Application error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(HTTP_PORT, () => {
  logger.info(`Server running on port ${HTTP_PORT}`);
  console.log(`🌍 i18next Translation Server: http://localhost:${HTTP_PORT}`);
  console.log(`📚 Try: http://localhost:${HTTP_PORT}/api/translate?language=es&key=greeting`);
});
