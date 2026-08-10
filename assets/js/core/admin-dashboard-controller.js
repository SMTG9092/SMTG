/**
 * SMTG Enterprise ERP/WMS
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
    if (!container && !document.getElementById('totalUsersVal')) {
        setTimeout(initAdminDashboard, 100);
        return;
    }

    try {
        const tableName = APP_CONFIG?.DATABASE?.USER_PROFILES_TABLE || 'user_profiles';

        // 1. Récupération réelle depuis Supabase (Utilisateurs, Rôles, Pages, Journaux)
        const [usersRes, rolesRes, pagesRes, logsRes] = await Promise.all([
            supabase.from(tableName).select('*'),
            supabase.from('roles').select('*'),
            supabase.from('pages').select('*'),
            supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(5)
        ]);

        const { data: users, error: usersError } = usersRes;
        const { data: roles, error: rolesError } = rolesRes;
        const { data: pages, error: pagesError } = pagesRes;
        const { data: logs, error: logsError } = logsRes;

        if (usersError) console.warn("Erreur chargement utilisateurs:", usersError.message);
        if (rolesError) console.warn("Erreur chargement rôles:", rolesError.message);
        if (pagesError) console.warn("Erreur chargement pages:", pagesError.message);

        // 2. Traitement et affichage des Utilisateurs
        if (users) {
            const totalUsers = users.length;
            const activeUsers = users.filter(u => u.actif === true || u.actif === 1).length;
            const inactiveUsers = totalUsers - activeUsers;

            updateElementText('totalUsersVal', totalUsers);
            updateElementText('activeUsersVal', activeUsers);
            updateElementText('inactiveUsersVal', inactiveUsers);
            updateElementText('userListCount', `${totalUsers} membres`);

            // Remplissage de la liste des utilisateurs récents / connectés
            if (container) {
                container.innerHTML = '';
                if (users.length === 0) {
                    container.innerHTML = '<div style="font-size: 11px; color: #8a99ad; text-align: center; padding: 20px;">Aucun utilisateur trouvé</div>';
                } else {
                    // Afficher les 5 premiers utilisateurs réels
                    users.slice(0, 5).forEach(user => {
                        const fullName = user.nom_complet || `${user.nom || ''} ${user.prenom || ''}`.trim() || user.username || 'Utilisateur';
                        const isActif = user.actif === true || user.actif === 1;
                        const badgeColor = isActif ? '#10b981' : '#ef4444';
                        const badgeText = isActif ? 'Actif' : 'Inactif';
                        const rgbBg = isActif ? '16, 185, 129' : '239, 68, 68';
                        const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'US';

                        const rowHTML = `
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; background: rgba(255,255,255,0.02); border-radius: 6px; margin-bottom: 4px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div style="width: 26px; height: 26px; background: rgba(16,185,129,0.2); color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700;">${initials}</div>
                                    <div>
                                        <div style="color: #fff; font-weight: 600; font-size: 11px;">${escapeHtml(fullName)}</div>
                                        <div style="font-size: 8px; color: #8a99ad;">${escapeHtml(user.email || user.username || 'Pas d\'email')}</div>
                                    </div>
                                </div>
                                <span style="font-size: 8px; padding: 2px 5px; border-radius: 4px; background: rgba(${rgbBg}, 0.15); color: ${badgeColor};">${badgeText}</span>
                            </div>
                        `;
                        container.insertAdjacentHTML('beforeend', rowHTML);
                    });
                }
            }
        }

        // 3. Traitement et affichage des Rôles
        if (roles) {
            const totalRoles = roles.length;
            updateElementText('totalRolesVal', totalRoles);
        }

        // 4. Traitement et affichage des Pages
        if (pages) {
            const totalPages = pages.length;
            const activePages = pages.pages_actives || pages.filter(p => p.actif === true || p.actif === 1).length;
            const inactivePages = totalPages - activePages;

            updateElementText('totalPagesVal', totalPages);
            updateElementText('activePagesVal', activePages);
            updateElementText('inactivePagesVal', inactivePages);
        }

        // 5. Traitement des Journaux Système Récent (System Logs)
        const logsContainer = document.getElementById('systemLogsTableBody');
        if (logsContainer && logs && !logsError) {
            logsContainer.innerHTML = '';
            if (logs.length === 0) {
                logsContainer.innerHTML = '<tr><td colspan="5" style="padding: 10px; text-align: center; color: #8a99ad;">Aucun journal récent</td></tr>';
            } else {
                logs.forEach(log => {
                    const levelColor = log.niveau === 'ERROR' ? '#ef4444' : log.niveau === 'WARN' ? '#f59e0b' : '#10b981';
                    const formattedDate = log.created_at ? new Date(log.created_at).toLocaleString('fr-FR') : '--';
                    
                    const tr = `
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                            <td style="padding: 5px 4px;"><span style="color: ${levelColor}; font-weight: 700;">${escapeHtml(log.niveau || 'INFO')}</span></td>
                            <td style="padding: 5px 4px; color: #fff;">${escapeHtml(log.message || '')}</td>
                            <td style="padding: 5px 4px;">${escapeHtml(log.utilisateur || 'Système')}</td>
                            <td style="padding: 5px 4px;">${formattedDate}</td>
                            <td style="padding: 5px 4px; text-align: right;">${escapeHtml(log.ip || '127.0.0.1')}</td>
                        </tr>
                    `;
                    logsContainer.insertAdjacentHTML('beforeend', tr);
                });
            }
        }

    } catch (err) {
        console.error("Erreur critique chargement dashboard admin:", err);
        if (container) {
            container.innerHTML = '<div style="font-size: 11px; color: #ef4444; text-align: center; padding: 20px;">Erreur de connexion à la base de données</div>';
        }
    }
}

function updateElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

initAdminDashboard();
