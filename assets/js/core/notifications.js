/**
 * Module de gestion des notifications (Supabase Realtime + UI)
 * SMTG - Système de Management et de Traçabilité Globale
 */

import supabase from './supabase.js';

let notificationsChannel = null;

export async function initNotifications() {
    const notifBtn = document.getElementById('notifBtn');
    const notifDropdown = document.getElementById('notifDropdown');
    const notifListContainer = document.getElementById('notifListContainer');
    const notifCountBadge = document.querySelector('.notification-badge-dot');
    const notifCountText = document.getElementById('notifCountText');

    if (!notifBtn || !notifDropdown || !notifListContainer) return;

    // 1. Gestion de l'affichage du menu déroulant au clic sur la cloche
    notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = notifDropdown.style.display === 'block';
        notifDropdown.style.display = isVisible ? 'none' : 'block';
        
        // Si on ouvre le panneau, on peut marquer comme lues si besoin ou juste consulter
        if (!isVisible) {
            fetchAndRenderNotifications();
        }
    });

    // Fermer le dropdown si on clique ailleurs sur la page
    document.addEventListener('click', (e) => {
        if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
            notifDropdown.style.display = 'none';
        }
    });

    // 2. Charger les notifications initiales
    await fetchAndRenderNotifications();

    // 3. Configurer l'écouteur Realtime Supabase pour les nouvelles notifications
    setupRealtimeNotifications();
}

/**
 * Récupère les notifications depuis la base de données et met à jour l'UI
 */
async function fetchAndRenderNotifications() {
    const notifListContainer = document.getElementById('notifListContainer');
    const notifCountBadge = document.querySelector('.notification-badge-dot');
    const notifCountText = document.getElementById('notifCountText');

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) return;
        const userId = session.user.id;

        // Récupérer les 20 dernières notifications de l'utilisateur (ou globales user_id is null)
        const { data: notifications, error } = await supabase
            .from('notifications')
            .select('*')
            .or(`user_id.eq.${userId},user_id.is.null`)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        // Compter les non lues
        const unreadList = notifications.filter(n => n.is_read === false);
        const unreadCount = unreadList.length;

        // Mettre à jour le badge visuel
        if (notifCountBadge) {
            if (unreadCount > 0) {
                notifCountBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                notifCountBadge.style.display = 'inline-block';
            } else {
                notifCountBadge.style.display = 'none';
            }
        }

        if (notifCountText) {
            notifCountText.textContent = `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`;
        }

        // Rendu de la liste HTML
        if (!notifications || notifications.length === 0) {
            notifListContainer.innerHTML = '<div style="padding: 15px; text-align: center; color: var(--text-muted); font-size: 11px;">Aucune notification</div>';
            return;
        }

        notifListContainer.innerHTML = notifications.map(notif => {
            let iconClass = 'fas fa-info-circle';
            let iconColor = '#10b981';

            if (notif.type === 'warning') {
                iconClass = 'fas fa-exclamation-triangle';
                iconColor = '#f59e0b';
            } else if (notif.type === 'danger' || notif.type === 'error') {
                iconClass = 'fas fa-times-circle';
                iconColor = '#ef4444';
            }

            const timeAgo = formatTimeAgo(notif.created_at);
            const bgStyle = notif.is_read ? 'background: transparent;' : 'background: rgba(16, 185, 129, 0.05);';

            return `
                <div class="notif-item" data-id="${notif.id}" style="padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); cursor: pointer; transition: background 0.2s; ${bgStyle}" onclick="markNotificationAsRead(${notif.id})">
                    <div style="display: flex; gap: 10px; align-items: flex-start;">
                        <div style="color: ${iconColor}; font-size: 13px; margin-top: 2px;"><i class="${iconClass}"></i></div>
                        <div style="flex: 1;">
                            <div style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 2px;">${escapeHtml(notif.title)}</div>
                            <div style="font-size: 10px; color: var(--text-muted); line-height: 1.3; margin-bottom: 4px;">${escapeHtml(notif.message)}</div>
                            <div style="font-size: 9px; color: rgba(255,255,255,0.3);">${timeAgo}</div>
                        </div>
                        ${!notif.is_read ? '<div style="width: 6px; height: 6px; background: var(--primary-glow); border-radius: 50%; margin-top: 4px;"></div>' : ''}
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error("Erreur lors du chargement des notifications:", err);
    }
}

/**
 * Marquer une notification comme lue dans Supabase
 */
window.markNotificationAsRead = async function(notificationId) {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true, updated_at: new Date().toISOString() })
            .eq('id', notificationId);

        if (!error) {
            fetchAndRenderNotifications();
        }
    } catch (err) {
        console.error("Erreur marquage notification lue:", err);
    }
};

/**
 * Configuration Realtime pour écouter les insertions en direct
 */
function setupRealtimeNotifications() {
    if (notificationsChannel) return;

    notificationsChannel = supabase
        .channel('public:notifications')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications'
        }, payload => {
            const newNotif = payload.new;
            // Vérifier si la notification concerne l'utilisateur ou est globale (user_id is null)
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (!session || !session.user) return;
                const userId = session.user.id;

                if (!newNotif.user_id || newNotif.user_id === userId) {
                    fetchAndRenderNotifications();
                    
                    // Optionnel : Afficher un petit toast ou alert visuel discret si besoin
                }
            });
        })
        .subscribe();
}

/**
 * Utilitaire pour formuler le temps écoulé
 */
function formatTimeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return "À l'instant";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays} j`;
}

/**
 * Sécurisation contre les injections XSS basiques
 */
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
}

// Initialisation automatique au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    // Petit délai pour s'assurer que Supabase session est prête
    setTimeout(initNotifications, 500);
});
