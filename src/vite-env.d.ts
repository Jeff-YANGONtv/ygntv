/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_MEDIA_BASE_URL?: string;
  readonly VITE_TMDB_API_KEY?: string;
  readonly VITE_PUSHER_APP_KEY?: string;
  readonly VITE_PUSHER_APP_CLUSTER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'hls.js/light' {
  import Hls from 'hls.js';
  export default Hls;
}
