declare global {
  interface AppSettings {
    
  }

  interface Window {
    Maven?: {
      ChatWidget?: {
        load: (config: {
          orgFriendlyId: string;
          agentFriendlyId: string;
          bgColor: string;
          signedUserData: string;
        }) => void;
      };
    };
  }
}

export {};