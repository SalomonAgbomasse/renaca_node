<template>
  <div class="support-assistant-wrapper">
    <!-- Bouton Flottant Support -->
    <button
      v-if="!isOpen"
      class="support-floating-btn shadow-lg"
      @click="toggleChat"
      title="Ouvrir AAVIE Digital"
    >
      <div class="online-indicator-dot"></div>
      <i class="fas fa-headset fa-lg me-2"></i>
      <span class="fw-bold">AAVIE Digital</span>
    </button>

    <!-- Fenêtre de Dialogue Support -->
    <transition name="support-slide-up">
      <div v-if="isOpen" class="support-chat-window shadow-xl border-0">
        <!-- Header -->
        <div class="support-chat-header d-flex align-items-center justify-content-between px-3 py-2">
          <div class="d-flex align-items-center gap-2 flex-grow-1 min-w-0 me-2">
            <div class="support-avatar-icon flex-shrink-0">
              <i class="fas fa-user-tie text-white fa-lg"></i>
            </div>
            <div class="header-text-container min-w-0">
              <div class="d-flex align-items-center gap-2 mb-0">
                <span class="support-header-title text-truncate">AAVIE Digital</span>
                <span class="badge badge-online">
                  En ligne
                </span>
              </div>
              <div class="support-header-sub text-truncate">
                Conseiller L'Africaine Vie • Espace RENACA
              </div>
            </div>
          </div>
          <div class="d-flex align-items-center gap-1 flex-shrink-0">
            <button class="btn btn-icon-glass" @click="clearHistory" title="Effacer la conversation">
              <i class="fas fa-trash-can"></i>
            </button>
            <button class="btn btn-icon-glass" @click="toggleChat" title="Réduire">
              <i class="fas fa-minus"></i>
            </button>
          </div>
        </div>

        <!-- Corps des Messages -->
        <div class="support-chat-body p-3" ref="chatBodyRef">
          <!-- Message de bienvenue -->
          <div v-if="messages.length === 0" class="text-center my-3">
            <div class="support-welcome-badge mb-3">
              <div class="support-welcome-icon mx-auto mb-2">
                <i class="fas fa-shield-alt text-aavie-green fa-lg"></i>
              </div>
              <h6 class="fw-bold mb-1 text-aavie-dark">Bienvenue sur AAVIE Digital</h6>
              <p class="text-muted small mb-0">Votre conseiller L'Africaine Vie pour vous accompagner sur le simulateur RENACA (souscriptions, calculs de primes et validation de dossiers).</p>
            </div>

            <!-- Suggestions rapides -->
            <div class="d-flex flex-column gap-2 text-start mt-3">
              <small class="fw-bold text-muted text-uppercase fs-xs">Questions fréquentes :</small>
              <button
                v-for="(suggestion, idx) in quickSuggestions"
                :key="idx"
                class="btn btn-outline-secondary btn-sm text-start py-2 px-3 rounded-3 support-suggestion-btn"
                @click="sendQuickPrompt(suggestion)"
              >
                <i class="fas fa-circle-question text-aavie-green me-2"></i>{{ suggestion }}
              </button>
            </div>
          </div>

          <!-- Liste des messages -->
          <div v-for="(msg, index) in messages" :key="index" class="support-message-row mb-3" :class="msg.role">
            <div class="d-flex gap-2" :class="msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'">
              <!-- Avatar -->
              <div class="support-msg-avatar" :class="msg.role">
                <i :class="msg.role === 'user' ? 'fas fa-user' : 'fas fa-headset'"></i>
              </div>

              <!-- Bulle -->
              <div class="support-msg-bubble" :class="msg.role">
                <div class="support-msg-text" v-html="formatMessage(msg.text)"></div>
                <small class="support-msg-time">{{ msg.time }}</small>
              </div>
            </div>
          </div>

          <!-- Animation de chargement / saisie -->
          <div v-if="isLoading" class="support-message-row mb-3 model">
            <div class="d-flex gap-2 flex-row">
              <div class="support-msg-avatar model">
                <i class="fas fa-headset"></i>
              </div>
              <div class="support-msg-bubble model py-2 px-3">
                <div class="support-typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer / Saisie -->
        <div class="support-chat-footer p-2 border-top bg-light">
          <form @submit.prevent="sendMessage" class="d-flex gap-2 align-items-center">
            <input
              type="text"
              v-model="inputPrompt"
              placeholder="Posez votre question sur un contrat, produit, prime..."
              class="form-control form-control-sm rounded-pill px-3 support-input"
              :disabled="isLoading"
              ref="inputRef"
            />
            <button
              type="submit"
              class="btn support-send-btn rounded-circle"
              :disabled="isLoading || !inputPrompt.trim()"
            >
              <i class="fas fa-paper-plane text-white"></i>
            </button>
          </form>
          <div class="text-center mt-1">
            <small class="text-muted" style="font-size: 10px;">
              <i class="fas fa-shield-check text-aavie-green me-1"></i>L'Africaine Vie Bénin SA • Partenaire RENACA
            </small>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, nextTick } from 'vue';
import ApiService from '../../services/ApiService';

interface Message {
  role: 'user' | 'model';
  text: string;
  time: string;
}

export default defineComponent({
  name: 'AiAssistantWidget',
  setup() {
    const isOpen = ref(false);
    const isLoading = ref(false);
    const inputPrompt = ref('');
    const messages = ref<Message[]>([]);
    const chatBodyRef = ref<HTMLDivElement | null>(null);
    const inputRef = ref<HTMLInputElement | null>(null);

    const quickSuggestions = [
      'Quelles sont les 2 natures de crédit gérées (Amortissable, Constant) ?',
      'Comment fonctionne l\'option Perte d\'Emploi ?',
      'Comment sont calculées les primes PD, PC, SURP et PUTTC ?',
      'Quelles sont les règles de calcul des dates d\'échéance ?'
    ];

    const toggleChat = () => {
      isOpen.value = !isOpen.value;
      if (isOpen.value) {
        scrollToBottom();
        nextTick(() => {
          inputRef.value?.focus();
        });
      }
    };

    const scrollToBottom = () => {
      nextTick(() => {
        if (chatBodyRef.value) {
          chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight;
        }
      });
    };

    const clearHistory = () => {
      messages.value = [];
    };

    const getCurrentTime = () => {
      const now = new Date();
      return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    };

    const formatMessage = (txt: string): string => {
      if (!txt) return '';
      let formatted = txt
        .replace(/\n/g, '<br/>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-light text-dark px-1 rounded">$1</code>');
      return formatted;
    };

    const sendMessage = async () => {
      const userText = inputPrompt.value.trim();
      if (!userText || isLoading.value) return;

      messages.value.push({
        role: 'user',
        text: userText,
        time: getCurrentTime()
      });

      inputPrompt.value = '';
      isLoading.value = true;
      scrollToBottom();

      try {
        const historyPayload = messages.value.map(m => ({
          role: m.role,
          text: m.text
        }));

        const res = await ApiService.post('/ai/chat', {
          message: userText,
          history: historyPayload.slice(0, -1)
        });

        if (res.data && res.data.reply) {
          messages.value.push({
            role: 'model',
            text: res.data.reply,
            time: getCurrentTime()
          });
        } else {
          messages.value.push({
            role: 'model',
            text: 'Désolé, je n\'ai pas pu traiter votre demande pour le moment.',
            time: getCurrentTime()
          });
        }
      } catch (err: any) {
        messages.value.push({
          role: 'model',
          text: 'Une indisponibilité temporaire est survenue. Veuillez réessayer dans quelques instants.',
          time: getCurrentTime()
        });
      } finally {
        isLoading.value = false;
        scrollToBottom();
      }
    };

    const sendQuickPrompt = (prompt: string) => {
      inputPrompt.value = prompt;
      sendMessage();
    };

    return {
      isOpen,
      isLoading,
      inputPrompt,
      messages,
      quickSuggestions,
      chatBodyRef,
      inputRef,
      toggleChat,
      clearHistory,
      sendMessage,
      sendQuickPrompt,
      formatMessage
    };
  }
});
</script>

<style scoped>
/* Charte Graphique L'Africaine Vie :
   - Vert institutionnel (Pantone 361 C) : #33b04a
   - Jaune / Lime (Pantone 394 C)        : #ede947
   - Noir / Anthracite (Black C)          : #231f20
   - Vert foncé dégradé                  : #1b6829
*/

.support-assistant-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1060;
  font-family: inherit;
}

/* Bouton flottant */
.support-floating-btn {
  background: linear-gradient(135deg, #33b04a 0%, #1b6829 100%);
  color: white;
  border: none;
  padding: 12px 22px;
  border-radius: 50px;
  cursor: pointer;
  display: flex;
  align-items: center;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 25px -5px rgba(51, 176, 74, 0.4), 0 8px 10px -6px rgba(51, 176, 74, 0.2);
}

.support-floating-btn:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 15px 30px -5px rgba(51, 176, 74, 0.55), 0 10px 12px -6px rgba(51, 176, 74, 0.3);
}

.online-indicator-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  background-color: #ede947;
  border: 2px solid #1b6829;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(237, 233, 71, 0.7); }
  70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(237, 233, 71, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(237, 233, 71, 0); }
}

/* Fenêtre de dialogue */
.support-chat-window {
  width: 410px;
  height: 550px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 48px);
  background: #ffffff;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 35px -5px rgba(35, 31, 32, 0.2), 0 10px 15px -5px rgba(35, 31, 32, 0.1);
  border: 1px solid rgba(51, 176, 74, 0.2) !important;
}

/* Header aux couleurs de L'Africaine Vie */
.support-chat-header {
  background: linear-gradient(135deg, #33b04a 0%, #1b6829 100%);
  color: #ffffff !important;
  border-bottom: 3px solid #ede947;
  padding: 10px 14px;
}

.header-text-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: 1.25;
}

.support-header-title {
  color: #ffffff !important;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.support-header-sub {
  color: rgba(255, 255, 255, 0.92) !important;
  font-size: 0.73rem;
  margin-top: 1px;
}

.badge-online {
  background-color: #ede947 !important;
  color: #231f20 !important;
  font-weight: 700;
  font-size: 0.65rem;
  padding: 2px 7px;
  border-radius: 10px;
}

.support-avatar-icon {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.22);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon-glass {
  background: rgba(255, 255, 255, 0.18);
  color: white;
  border: none;
  border-radius: 8px;
  width: 28px;
  height: 28px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  transition: all 0.2s;
}

.btn-icon-glass:hover {
  background: rgba(255, 255, 255, 0.35);
  color: white;
  transform: scale(1.05);
}

/* Corps */
.support-chat-body {
  flex: 1;
  overflow-y: auto;
  background: #fbfdfc;
}

.support-welcome-badge {
  background: #ffffff;
  border: 1px solid #dff2e3;
  padding: 16px;
  border-radius: 12px;
}

.support-welcome-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #eaf8ee;
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-aavie-green {
  color: #33b04a !important;
}

.text-aavie-dark {
  color: #231f20 !important;
}

.support-suggestion-btn {
  font-size: 0.82rem;
  background: #ffffff;
  border-color: #e2e8f0;
  color: #231f20;
  transition: all 0.2s;
}

.support-suggestion-btn:hover {
  background: #eaf8ee;
  border-color: #33b04a;
  color: #1b6829;
}

/* Messages */
.support-msg-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}

.support-msg-avatar.user {
  background: #33b04a;
  color: white;
}

.support-msg-avatar.model {
  background: #eaf8ee;
  color: #1b6829;
}

.support-msg-bubble {
  max-width: 82%;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 0.88rem;
  line-height: 1.45;
}

.support-msg-bubble.user {
  background: linear-gradient(135deg, #33b04a 0%, #28993d 100%);
  color: white;
  border-bottom-right-radius: 3px;
}

.support-msg-bubble.model {
  background: #ffffff;
  color: #231f20;
  border-bottom-left-radius: 3px;
  box-shadow: 0 1px 4px rgba(35, 31, 32, 0.08);
  border: 1px solid #edf5ef;
}

.support-msg-time {
  display: block;
  font-size: 10px;
  margin-top: 4px;
  opacity: 0.75;
}

.support-msg-bubble.user .support-msg-time {
  color: #eaf8ee;
  text-align: right;
}

.support-msg-bubble.model .support-msg-time {
  color: #64748b;
}

/* Footer / Input */
.support-input:focus {
  border-color: #33b04a;
  box-shadow: 0 0 0 0.2rem rgba(51, 176, 74, 0.2);
}

.support-send-btn {
  width: 34px;
  height: 34px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #33b04a 0%, #1b6829 100%);
  border: none;
  transition: opacity 0.2s;
}

.support-send-btn:hover {
  opacity: 0.9;
}

.fs-xs {
  font-size: 0.72rem;
}

/* Typing Indicator */
.support-typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 2px;
}

.support-typing-indicator span {
  width: 6px;
  height: 6px;
  background: #33b04a;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.support-typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.support-typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* Transitions */
.support-slide-up-enter-active,
.support-slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.support-slide-up-enter-from,
.support-slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
</style>
