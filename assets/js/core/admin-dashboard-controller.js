/**
 * SMTG Enterprise - Admin Dashboard Controller (100% Data Base / Supabase)
 * assets/js/core/admin-dashboard-controller.js
 */

import supabase from './supabase.js';
import APP_CONFIG from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    loadAdminDashboardData();
});

document.addEventListener('dashboardLoaded', () => {
    loadAdminDashboardData();
});

export async function loadAdminDashboardData() {
    try {
        const userProfilesTable = APP_CONFIG?.DATABASE?.USER_PROFILES_TABLE || 'user_profiles';

        // 1. Requêtes simultanées directes vers la base de données Supabase / PostgreSQL
        const [
            usersRes, 
            rolesRes, 
            pagesRes, 
            permissionsRes, 
            hubModulesRes, 
            logsRes
        ] = await Promise.all([
            supabase.from(userProfilesTable).select('*'),
            supabase.from('roles').select('*'),
            supabase.from('pages').select('*'),
            supabase.from('permissions').select('*'),
            supabase.from('hub_modules').select('*'),
            supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(10)
        ]);

        // Gestion des erreurs éventuelles de la base de données
        if (usersRes.error) console.error("Erreur table user_profiles:", usersRes.error.message);
        if (rolesRes.error) console.error("Erreur table roles:", rolesRes.error.message);
        if (pagesRes.error) console.error("Erreur table pages:", pagesRes.error.message);
        if (permissionsRes.error) console.error("Erreur table permissions:", permissionsRes.error.message);
        if (hubModulesRes.error) console.error("Erreur table hub_modules:", hubModulesRes.error.message);
        if (logsRes.error) console.error("Erreur table notifications/logs:", logsRes.error.message);

        const users = usersRes.data || [];
        const roles = rolesRes.data || [];
        const pages = pagesRes.data || [];
        const permissions = permissionsRes.data || [];
        const hubModules = hubModulesRes.data || [];
        const logs = logsRes.data || [];

        // 2. Injection des vrais totaux dans les cartes du haut
        setElementText('totalUsersVal', users.length);
        setElementText('totalRolesVal', roles.length);
        setElementText('totalPagesVal', pages.length);
        setElementText('totalModulesVal', hubModules.length);
        setElementText('totalPermissionsVal', permissions.length);

        // Calcul du nombre de connexions (basé sur les utilisateurs actifs ou un log de session)
        setElementText('totalConnectionsVal', users.filter(u => u.actif).length || users.length);

        // 3. Affichage dynamique des dernières connexions (depuis `user_profiles` trié par `dernier_login`)
        renderLastLogins(users, roles);

        // 4. Affichage dynamique des journaux système récents (`notifications` ou table de logs)
        renderSystemLogs(logs);

        // 5. Affichage dynamique des modules système réels
        renderHubModules(hubModules);

        // 6. Affichage dynamique des pages les plus utilisées (si la table possède un compteur ou un suivi)
        renderPagesTable(pages);

    } catch (err) {
        console.error("Erreur critique de connexion à la base de données SMTG:", err);
    }
}

function renderLastLogins(users, roles) {
    const container = document.getElementById('lastLoginsContainer');
    if (!container) return;

    // Créer une correspondance des rôles (id -> nom)
    const roleMap = {};
    roles.forEach(r => { roleMap[r.id] = r.nom || r.role_name; });

    // Trier par date de dernier login décroissante
    const sorted = [...users]
        .filter(u => u.dernier_login || u.updated_at)
        .sort((a, b) => new Date(b.dernier_login || b.updated_at) - new Date(a.dernier_login || a.updated_at))
        .slice(0, 3);

    if (sorted.length === 0) {
        container.innerHTML = '<div style="font-size: 10px; color: #8a99ad; text-align: center; padding: 10px;">Aucune connexion récente trouvée en BD</div>';
        return;
    }

    container.innerHTML = '';
    sorted.forEach((user, index) => {
        const fullName = user.nom_complet || `${user.nom || ''} ${user.prenom || ''}`.trim() || user.username || 'Utilisateur SMTG';
        const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'SM';
        const roleName = roleMap[user.role_id] || 'Collaborateur';
        const loginDate = new Date(user.dernier_login || user.updated_at);
        const timeFormatted = !isNaN(loginDate) ? loginDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--';

        const bgColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
        const color = bgColors[index % bgColors.length];

        const html = `
            <div style="display: flex; justify-content: space-between; align-items: center; ${index < sorted.length - 1 ? 'border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 6px;' : ''}">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 26px; height: 26px; background: ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #000;">${escapeHtml(initials)}</div>
                    <div>
                        <div style="font-size: 11px; color: #fff; font-weight: 600;">${escapeHtml(fullName)} <span style="font-size: 8px; background: rgba(16,185,129,0.2); color: #10b981; padding: 1px 4px; border-radius: 3px;">${escapeHtml(roleName)}</span></div>
                        <div style="font-size: 9px; color: #8a99ad;">${escapeHtml(user.email || user.username || 'Session active')}</div>
                    </div>
                </div>
                <div style="text-align: right; font-size: 10px; color: #fff;">${timeFormatted}<br><span style="font-size: 8px; color: #8a99ad;">Aujourd'hui</span></div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

function renderSystemLogs(logs) {
    const tbody = document.getElementById('systemLogsTableBody');
    if (!tbody) return;

    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="padding: 8px; text-align: center; color: #8a99ad;">Aucun journal en base de données</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    logs.slice(0, 5).forEach(log => {
        const level = (log.type || log.niveau || 'INFO').toUpperCase();
        const color = level === 'ERROR' ? '#ef4444' : level === 'WARN' ? '#f59e0b' : '#10b981';
        const tr = `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 5px 4px;"><span style="color: ${color}; font-weight: 700;">${escapeHtml(level)}</span></td>
                <td style="padding: 5px 4px; color: #fff;">${escapeHtml(log.message || log.title || 'Action système')}</td>
                <td style="padding: 5px 4px;">${escapeHtml(log.user_name || 'Système SMTG')}</td>
                <td style="padding: 5px 4px; text-align: right;">${escapeHtml(log.ip_address || '127.0.0.1')}</td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', tr);
    });
}

function renderHubModules(modules) {
    // Si tu as un conteneur dédié aux modules de la base de données
    const container = document.getElementById('hubModulesContainer');
    if (!container || modules.length === 0) return;
    
    // Injection dynamique des modules stockés dans la table `hub_modules`
    container.innerHTML = '';
    modules.forEach(mod => {
        // ... Logique de rendu dynamique si nécessaire
    });
}

function renderPagesTable(pages) {
    // Logique optionnelle pour injecter les pages de la table `pages`
}

function setElementText(id, text) {
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
