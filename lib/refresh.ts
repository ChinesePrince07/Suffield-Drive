// Helper to trigger file list refresh from anywhere in the app
export function refreshFileList() {
    if (typeof window !== 'undefined' && (window as any).__refreshFileList) {
        (window as any).__refreshFileList();
    }
}
