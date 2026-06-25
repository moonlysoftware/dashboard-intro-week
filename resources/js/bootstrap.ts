import axios from 'axios';

window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const csrfMeta = document.head.querySelector('meta[name="csrf-token"]');
if (csrfMeta instanceof HTMLMetaElement && csrfMeta.content) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfMeta.content;
}
