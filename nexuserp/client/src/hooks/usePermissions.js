import { useSelector } from 'react-redux';

export const usePermissions = (moduleName) => {
    const { user } = useSelector(s => s.auth);
    
    if (!user) return { canRead: false, canWrite: false, canExecute: false };
    if (user.role === 'ADMIN') return { canRead: true, canWrite: true, canExecute: true };

    const perm = user.permissions?.find(p => p.moduleName === moduleName);
    
    return {
        canRead: !!perm?.canRead,
        canWrite: !!perm?.canWrite,
        canExecute: !!perm?.canExecute
    };
};
