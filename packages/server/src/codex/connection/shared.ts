export const logins = new Map<
  string,
  {
    loginId: string;
    verificationUrl: string;
    userCode: string;
    dispose: () => void;
  }
>();

export const starting = new Map<
  string,
  Promise<{ verificationUrl: string; userCode: string }>
>();
