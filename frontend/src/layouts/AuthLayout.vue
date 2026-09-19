<template>
	<div class="auth-layout-wrapper">
		<div class="auth-background">
			<div class="auth-overlay"></div>
			<div class="auth-content">
				<div class="auth-card-container">
					<router-view></router-view>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { defineComponent, onMounted, onUnmounted } from "vue";

	export default defineComponent({
		name: "AuthLayout",
		components: {},
		setup() {
			onMounted(() => {
				document.body.classList.remove("bg-body-secondary", "bg-sidbar");
				document.body.classList.add("bg-auth");
				document.body.style.overflow = 'hidden';
				document.documentElement.style.overflow = 'hidden';
			});
			
			onUnmounted(() => {
				document.body.style.overflow = '';
				document.documentElement.style.overflow = '';
				document.body.classList.remove("bg-auth");
				document.body.classList.add("bg-body-secondary");
			});
		}		
	});
</script>

<style scoped>
.auth-layout-wrapper {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	overflow: hidden;
	height: 100vh;
	width: 100vw;
}

.auth-background {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	height: 100%;
	width: 100%;
	background: 
		linear-gradient(135deg, rgba(0, 80, 40, 0.7) 0%, rgba(0, 0, 0, 0.5) 100%),
		url('../assets/images/login_bg.png') center center / cover no-repeat;
}

.auth-overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.15);
	z-index: 0;
}

.auth-content {
	position: relative;
	z-index: 1;
	height: 100vh;
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 1rem;
	overflow-y: auto;
}

.auth-card-container {
	width: 100%;
	max-width: 460px;
	margin: auto;
}

/* Responsive */
@media (max-width: 768px) {
	.auth-content {
		padding: 1rem;
		align-items: flex-start;
		padding-top: 2rem;
	}
	
	.auth-card-container {
		max-width: 100%;
	}
}
</style>

<style>
/* Styles globaux */
body.bg-auth,
html.bg-auth {
	overflow: hidden !important;
	height: 100vh !important;
	width: 100vw !important;
}

body.bg-auth {
	position: fixed;
	width: 100%;
}
</style>
