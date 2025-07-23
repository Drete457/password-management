import { lazy } from 'react';

// Lazy load components that are heavy or used conditionally
export const LazyPasswordHealthDashboard = lazy(() => 
  import('./password-health-dashboard').then(module => ({
    default: module.PasswordHealthDashboard
  }))
);

export const LazyBreachCheckComponent = lazy(() => 
  import('./breach-check').then(module => ({
    default: module.BreachCheckComponent
  }))
);

export const LazyFileManager = lazy(() => 
  import('./file-manager').then(module => ({
    default: module.FileManager
  }))
);

export const LazyThemeSettings = lazy(() => 
  import('./theme-settings').then(module => ({
    default: module.ThemeSettings
  }))
);

export const LazyRandomCodeGenerator = lazy(() => 
  import('./random-code-generator').then(module => ({
    default: module.RandomCodeGenerator
  }))
);

export const LazyMasterPasswordSetup = lazy(() => 
  import('./master-password').then(module => ({
    default: module.MasterPasswordSetup
  }))
);

export const LazyMasterPasswordUnlock = lazy(() => 
  import('./master-password').then(module => ({
    default: module.MasterPasswordUnlock
  }))
);

export const LazyMasterPasswordChange = lazy(() => 
  import('./master-password').then(module => ({
    default: module.MasterPasswordChange
  }))
);
