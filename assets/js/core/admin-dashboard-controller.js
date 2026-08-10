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
    const logsContainer = document.getElementById('systemLogsTableBody');
    
    if (!container && !logsContainer && !document.getElementById('totalUsersVal')) {
        setTimeout(initAdminDashboard, 100);
        return;
    }

    try {
        const userProfilesTable = APP_CONFIG?.DATABASE?.USER_PROFILES_TABLE || 'user_profiles';

        // 1. Récupération réelle des données depuis PostgreSQL / Supabase selon les tables exactes du schéma
        const [
            usersRes, 
            rolesRes, 
            pagesRes, 
            permissionsRes, 
            hubModulesRes, 
            logsRes
        ] = await Promise.all([
            supabase.from(userProfilesTable).select('id, nom_complet, nom, prenom, username, email, dernier_login, actif, role_id'),
            supabase.from('roles').select('*'),
            supabase.from('pages').select('*'),
            supabase.from('permissions').select('*'),
            supabase.from('hub_modules').select('*'),
            supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(5)
        ]);

        const { data: users, error: usersError } = usersRes;
        const { data: roles, error: rolesError } = rolesRes;
        const { data: pages, error: pagesError } = pagesRes;
        const { data: permissions, error: permError } = permissionsRes;
        const { data: hubModules, error: modError } = hubModulesRes;
        const { data: logs, error: logsError } = logsRes;

        if (usersError) console.warn("Erreur chargement utilisateurs:", usersError.message);
        if (rolesError) console.warn("Erreur chargement rôles:", rolesError.message);
        if (pagesError) console.warn("Erreur chargement pages:", pagesError.message);
        if (permError) console.warn("Erreur chargement permissions:", permError.message);
        if (modError) console.warn("Erreur chargement modules:", modError.message);

        // 2. Calcul et affichage des statistiques principales (Haut de page)
        if (users) {
            const totalUsers = users.length;
            updateElementText('totalUsersVal', totalUsers);
        }

        if (roles) {
            const totalRoles = roles.length;
            updateElementText('totalRolesVal', totalRoles);

            // Distribution des utilisateurs par rôle pour la section Donut / Statistiques
            if (users) {
                const roleMap = {};
                roles.forEach(r => { roleMap[r.id] = r.nom; });

                const roleCounts = {};
                users.forEach(u => {
                    const rName = roleMap[u.role_id] || 'Autres';
                    roleCounts[rName] = (roleCounts[rName] || 0) + 1;
                });
                console.debug("Distribution réelle des utilisateurs par rôle:", roleCounts);
            }
        }

        if (pages) {
            const totalPages = pages.length;
            updateElementText('totalPagesVal', totalPages);
        }

        if (hubModules) {
            const totalModules = hubModules.length;
            updateElementText('totalModulesVal', totalModules);
        }

        if (permissions) {
            const totalPermissions = permissions.length;
            updateElementText('totalPermissionsVal', totalPermissions);
        }

        // 3. Remplissage dynamique des dernières connexions basées sur `dernier_login`
        const lastLoginsContainer = document.getElementById('lastLoginsContainer');
        if (users && lastLoginsContainer) {
            // Trier les utilisateurs par dernier_login décroissant
            const sortedUsers = [...users]
                .filter(u => u.dernier_login)
                .sort((a, b) => new Date(b.dernier_login) - new Date(a.dernier_login))
                .slice(0, 5);

            if (sortedUsers.length > 0) {
                lastLoginsContainer.innerHTML = '';
                sortedUsers.forEach((user, index) => {
                    const fullName = user.nom_complet || `${user.nom || ''} ${user.prenom || ''}`.trim() || user.username || 'Utilisateur';
                    const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'YS';
                    const loginDate = new Date(user.dernier_login);
                    const timeFormatted = loginDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    const dateFormatted = loginDate.toLocaleDateString('fr-FR');

                    const bgColors = ['#10b981', '#3b82f6', '#3b82f6', '#f59e0b', '#8b5cf6'];
                    const badgeBg = ['rgba(16,185,129,0.2)', 'rgba(59,130,246,0.2)', 'rgba(59,130,246,0.2)', 'rgba(245,158,11,0.2)', 'rgba(139,92,246,0.2)'];
                    const badgeColor = ['#10b981', '#3b82f6', '#3b82f6', '#f59e0b', '#8b5cf6'];
                    const colorIdx = index % bgColors.ItemCount || index;

                    const rowHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; ${index < sortedUsers.length - 1 ? 'border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 6px;' : ''}">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div style="width: 26px; height: 26px; background: ${bgColors[colorIdx]}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #000;">${initials}</div>
                                <div>
                                    <div style="font-size: 11px; color: #fff; font-weight: 600;">${escapeHtml(fullName)} <span style="font-size: 8px; background: ${badgeBg[colorIdx]}; color: ${badgeColor[colorIdx]}; padding: 1px 4px; border-radius: 3px;">${escapeHtml(user.service || 'Collaborateur')}</span></div>
                                    <div style="font-size: 9px; color: #8a99ad;">${escapeHtml(user.email || user.username || 'Connexion active')}</div>
                                </div>
                            </div>
                            <div style="text-align: right; font-size: 10px; color: #fff;">${timeFormatted}<br><span style="font-size: 8px; color: #8a99ad;">${dateFormatted}</span></div>
                        </div>
                    `;
                    lastLoginsContainer.insertAdjacentHTML('beforeend', rowHTML);
                });
            }
        }

        // 4. Traitement des Journaux Système / Notifications récents
        if (logsContainer && logs && !logsError) {
            logsContainer.innerHTML = '';
            if (logs.length === 0) {
                logsContainer.innerHTML = '<tr><td colspan="5" style="padding: 10px; text-align: center; color: #8a99ad;">Aucun journal récent dans la base de données</td></tr>';
            } else {
                logs.forEach(log => {
                    const levelColor = log.type === 'error' ? '#ef4444' : log.type === 'warning' ? '#f59e0b' : '#10b981';
                    const levelText = (log.type || 'INFO').toUpperCase();
                    const formattedDate = log.created_at ? new Date(log.created_at).toLocaleString('fr-FR') : '--';
                    
                    const tr = `
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                            <td style="padding: 5px 4px;"><span style="color: ${levelColor}; font-weight: 700;">${escapeHtml(levelText)}</span></td>
                            <td style="padding: 5px 4px; color: #fff;">${escapeHtml(log.title || '')} : ${escapeHtml(log.message || '')}</td>
                            <td style="padding: 5px 4px;">Système SMTG</td>
                            <td style="padding: 5px 4px;">${formattedDate}</td>
                            <td style="padding: 5px 4px; text-align: right;">127.0.0.1</td>
                        </tr>
                    `;
                    logsContainer.insertAdjacentHTML('beforeend', tr);
                });
            }
        }

    } catch (err) {
        console.error("Erreur critique lors du chargement des données réelles du tableau de bord:", err);
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
