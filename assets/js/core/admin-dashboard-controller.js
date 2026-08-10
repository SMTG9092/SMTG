/**
 * SMTG Enterprise - Admin Dashboard Controller (Real DB Joins)
 * assets/js/core/admin-dashboard-controller.js
 */

import supabase from './supabase.js';
import APP_CONFIG from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    loadAdminDashboardData();
});

export async function loadAdminDashboardData() {
    try {
        const userProfilesTable = APP_CONFIG?.DATABASE?.USER_PROFILES_TABLE || 'user_profiles';

        // 1. Requêtes simultanées avec Jointure (FK) vers user_profiles pour récupérer le nom réel et l'IP depuis la BD
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
            // Jointure explicite avec user_profiles b user_id
            supabase.from('notifications')
                .select(`
                    id,
                    title,
                    message,
                    type,
                    ip_address,
                    created_at,
                    user_id,
                    user_profiles:user_id (
                        nom_complet,
                        nom,
                        prenom,
                        username,
                        email
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(10)
        ]);

        if (usersRes.error) console.error("Erreur user_profiles:", usersRes.error.message);
        if (rolesRes.error) console.error("Erreur roles:", rolesRes.error.message);
        if (pagesRes.error) console.error("Erreur pages:", pagesRes.error.message);
        if (permissionsRes.error) console.error("Erreur permissions:", permissionsRes.error.message);
        if (hubModulesRes.error) console.error("Erreur hub_modules:", hubModulesRes.error.message);
        if (logsRes.error) console.error("Erreur notifications:", logsRes.error.message);

        const users = usersRes.data || [];
        const roles = rolesRes.data || [];
        const pages = pagesRes.data || [];
        const permissions = permissionsRes.data || [];
        const hubModules = hubModulesRes.data || [];
        const logs = logsRes.data || [];

        // 2. Injection des totaux
        setElementText('totalUsersVal', users.length);
        setElementText('totalRolesVal', roles.length);
        setElementText('totalPagesVal', pages.length);
        setElementText('totalModulesVal', hubModules.length);
        setElementText('totalPermissionsVal', permissions.length);
        setElementText('totalConnectionsVal', users.filter(u => u.actif).length || users.length);

        // 3. Rendu des connexions et journaux depuis la BD
        renderLastLogins(users, roles);
        renderSystemLogs(logs);

    } catch (err) {
        console.error("Erreur critique chargement dashboard SMTG:", err);
    }
}

function renderLastLogins(users, roles) {
    const container = document.getElementById('lastLoginsContainer');
    if (!container) return;

    const roleMap = {};
    roles.forEach(r => { roleMap[r.id] = r.nom || r.role_name; });

    const sorted = [...users]
        .filter(u => u.dernier_login || u.updated_at)
        .sort((a, b) => new Date(b.dernier_login || b.updated_at) - new Date(a.dernier_login || a.updated_at))
        .slice(0, 3);

    if (sorted.length === 0) {
        container.innerHTML = '<div style="font-size: 10px; color: #8a99ad; text-align: center; padding: 10px;">Aucune donnée en BD</div>';
        return;
    }

    container.innerHTML = '';
    sorted.forEach((user, index) => {
        const fullName = user.nom_complet || `${user.nom || ''} ${user.prenom || ''}`.trim() || user.username || 'Utilisateur';
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
                        <div style="font-size: 9px; color: #8a99ad;">${escapeHtml(user.email || user.username || '')}</div>
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

    if (!logs || logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="padding: 8px; text-align: center; color: #8a99ad;">Aucun journal en base de données</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    logs.slice(0, 5).forEach(log => {
        const level = (log.type || 'INFO').toUpperCase();
        const color = level === 'ERROR' ? '#ef4444' : level === 'WARN' ? '#f59e0b' : '#10b981';
        
        const profile = log.user_profiles;
        const userName = profile ? (profile.nom_complet || `${profile.nom || ''} ${profile.prenom || ''}`.trim() || profile.username) : 'Système SMTG';

        const tr = `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 5px 4px;"><span style="color: ${color}; font-weight: 700;">${escapeHtml(level)}</span></td>
                <td style="padding: 5px 4px; color: #fff;">${escapeHtml(log.message || log.title || '')}</td>
                <td style="padding: 5px 4px; color: #fff;">${escapeHtml(userName)}</td>
                <td style="padding: 5px 4px; text-align: right; color: #8a99ad;">${escapeHtml(log.ip_address || '127.0.0.1')}</td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', tr);
    });
}

function setElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
