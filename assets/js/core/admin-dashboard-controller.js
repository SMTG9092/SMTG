/**
 * SoufStock Enterprise ERP/WMS
 * assets/js/core/admin-dashboard-controller.js
 */

import supabase from './supabase.js';
import APP_CONFIG from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    initAdminDashboard();
});

document.addEventListener('dashboardLoaded', () => {
    initAdminDashboard();
});

export async function initAdminDashboard() {
    const container = document.getElementById('usersListContainer');
    if (!container) {
        setTimeout(initAdminDashboard, 100);
        return;
    }

    try {
        const tableName = APP_CONFIG?.DATABASE?.USER_PROFILES_TABLE || 'user_profiles';

        const [usersResponse, pagesResponse] = await Promise.all([
            supabase.from(tableName).select('*'),
            supabase.from('pages').select('*')
        ]);

        const { data: users, error: usersError } = usersResponse;
        const { data: pages, error: pagesError } = pagesResponse;

        if (usersError) throw usersError;

        if (users) {
            const totalUsers = users.length;
            const activeUsers = users.filter(u => u.actif === true || u.actif === 1).length;
            const inactiveUsers = totalUsers - activeUsers;

            const elTotal = document.getElementById('totalUsersVal');
            if (elTotal) elTotal.textContent = totalUsers;

            const elActive = document.getElementById('activeUsersVal');
            if (elActive) elActive.textContent = activeUsers;

            const elInactive = document.getElementById('inactiveUsersVal');
            if (elInactive) elInactive.textContent = inactiveUsers;

            const elCount = document.getElementById('userListCount');
            if (elCount) elCount.textContent = `${totalUsers} membres`;

            container.innerHTML = '';
            if (users.length === 0) {
                container.innerHTML = '<div style="font-size: 11px; color: #8a99ad; text-align: center; padding: 20px;">Aucun utilisateur trouvé</div>';
            } else {
                users.forEach(user => {
                    const fullName = user.nom_complet || `${user.nom || ''} ${user.prenom || ''}`.trim() || user.username || 'Utilisateur';
                    const isActif = user.actif === true || user.actif === 1;
                    const badgeColor = isActif ? '#10b981' : '#ef4444';
                    const badgeText = isActif ? 'Actif' : 'Inactif';
                    const rgbBg = isActif ? '16, 185, 129' : '239, 68, 68';

                    const rowHTML = '<div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; background: rgba(255,255,255,0.02); border-radius: 6px; margin-bottom: 4px;">' +
                        '<div style="display: flex; align-items: center; gap: 6px;">' +
                            '<i class="fas fa-user-circle" style="font-size: 14px; color: #3b82f6;"></i>' +
                            '<div>' +
                                '<div style="color: #fff; font-weight: 600; font-size: 11px;">' + fullName + '</div>' +
                                '<div style="font-size: 8px; color: #8a99ad;">' + (user.email || user.username || 'Pas d\'email') + '</div>' +
                            '</div>' +
                        '</div>' +
                        '<span style="font-size: 8px; padding: 2px 5px; border-radius: 4px; background: rgba(' + rgbBg + ', 0.15); color: ' + badgeColor + ';">' + badgeText + '</span>' +
                    '</div>';
                    
                    container.insertAdjacentHTML('beforeend', rowHTML);
                });
            }
        }

        if (!pagesError && pages) {
            const totalPages = pages.length;
            const activePages = pages.filter(p => p.actif === true || p.actif === 1).length;
            const inactivePages = totalPages - activePages;

            const elTotalPages = document.getElementById('totalPagesVal');
            if (elTotalPages) elTotalPages.textContent = totalPages;

            const elActivePages = document.getElementById('activePagesVal');
            if (elActivePages) elActivePages.textContent = activePages;

            const elInactivePages = document.getElementById('inactivePagesVal');
            if (elInactivePages) elInactivePages.textContent = inactivePages;
        } else if (pagesError) {
            console.error("Erreur lors du chargement des pages:", pagesError);
        }

    } catch (err) {
        console.error("Erreur lors du chargement des données dashboard:", err);
        const containerErr = document.getElementById('usersListContainer');
        if (containerErr) {
            containerErr.innerHTML = '<div style="font-size: 11px; color: #ef4444; text-align: center; padding: 20px;">Erreur de chargement</div>';
        }
    }
}

initAdminDashboard();
