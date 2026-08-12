import type { LanguageCode } from '../types';
import { DEFAULT_LANGUAGE } from './config';
import { en } from './translations/en';
import { kn } from './translations/kn';
import { hi } from './translations/hi';
import { te } from './translations/te';
import { ta } from './translations/ta';
import { ml } from './translations/ml';
import { mr } from './translations/mr';
import { bn } from './translations/bn';
import { gu } from './translations/gu';
import { pa } from './translations/pa';
import { or } from './translations/or';
import { as } from './translations/as';
import { ur } from './translations/ur';
import { kok } from './translations/kok';
import { ne } from './translations/ne';
import { sa } from './translations/sa';
import { mai } from './translations/mai';
import { mni } from './translations/mni';
import { ks } from './translations/ks';
import { sd } from './translations/sd';
import { doi } from './translations/doi';
import { brx } from './translations/brx';
import { sat } from './translations/sat';

const TRANSLATIONS: Record<LanguageCode, Record<string, any>> = {
  en,
  kn,
  hi,
  te,
  ta,
  ml,
  mr,
  bn,
  gu,
  pa,
  or,
  as,
  ur,
  kok,
  ne,
  sa,
  mai,
  mni,
  ks,
  sd,
  doi,
  brx,
  sat,
};

/**
 * Translate a key string into target language (defaults to English if missing)
 */
export function t(key: string, lang: LanguageCode = DEFAULT_LANGUAGE): string {
  const targetDict = TRANSLATIONS[lang] || TRANSLATIONS[DEFAULT_LANGUAGE];
  const fallbackDict = TRANSLATIONS[DEFAULT_LANGUAGE];

  const parts = key.split('.');

  // Helper to traverse key path
  const getNested = (dict: any) => {
    if (!dict) return undefined;
    let curr = dict;
    for (const p of parts) {
      if (curr && typeof curr === 'object' && p in curr) {
        curr = curr[p];
      } else {
        return undefined;
      }
    }
    return typeof curr === 'string' ? curr : undefined;
  };

  const val = getNested(targetDict) || getNested(fallbackDict);
  return val !== undefined ? val : key;
}

export * from './config';
