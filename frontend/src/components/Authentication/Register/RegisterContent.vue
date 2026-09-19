<template>
  <div class="row justify-content-center">
    <div >
      <div class="card mb-25 border-0 rounded-0 bg-white authentication-card">
        <div class="card-body letter-spacing">
          <div class="text-center mb-10">
            <img src="../../../assets/images/logo-guda-dark.png" alt="logo-icon" style="height: 100px;"/>
          </div>
          <h4 class="text-black fw-bold mb-0 text-center">
            Créer votre compte
          </h4>
          <div class="text-center">
            <span class="text-muted  mt-15 mt-md-30 mb-12 mb-md-20 fs-md-15 fs-lg-16" > Avez-vous déjà un compte ? 
              <router-link to="/login" class="fw-bold" >Se connecter maintenant </router-link>
            </span>
          </div>
          <Form ref="registerForm" @submit="addRegister" :validation-schema="registerSchema">
            <div class="form-group mb-10 mb-sm-15 mb-md-17">
              <label class="d-block text-black fw-semibold mb-10">Nom complet</label>
              <Field name="nomComplet" type="text" 
                class="form-control shadow-none fs-md-15 text-black" placeholder="Entrer le nom complet"/>
                <ErrorMessage name="nomComplet" class="text-danger"/>
            </div>
            <div class="form-group mb-10 mb-sm-15 mb-md-17">
              <label class="d-block text-black fw-semibold mb-10">
                Numéro de téléphone
              </label>
              <Field name="telephone" type="text" 
                class="form-control shadow-none fs-md-15 text-black" placeholder="Entrer le numéro de téléphone"/>
                <ErrorMessage name="telephone" class="text-danger"/>
            </div>
            <div class="form-group mb-10 mb-sm-15 mb-md-17">
              <label class="d-block text-black fw-semibold mb-10">
                Mot de passe 
              </label>
              <Field name="password" type="password" 
                class="form-control shadow-none fs-md-15 text-black" placeholder="Entrer le mot de passe"/>
                <ErrorMessage name="password" class="text-danger"/>
            </div>
            <div class="form-group mb-10 mb-sm-15 mb-md-17">
              <label class="d-block text-black fw-semibold mb-10">
                Confirmer le mot de passe
              </label>
              <Field name="password_confirm" type="password" 
                class="form-control shadow-none fs-md-15 text-black" placeholder="Confirmer le mot de passe"/>
                <ErrorMessage name="password_confirm" class="text-danger"/>
            </div>
            <div class="form-check form-check-primary mb-0 fs-md-15 fs-lg-16 text-muted lh-1 mb-15 mb-md-20">
            <Field type="checkbox"  class="form-check-input shadow-none" name="termes"  :value="true" id="remember-me"/>
              <ErrorMessage name="termes" class="text-danger"/>
              <label class="form-check-label" for="remember-me">
                j'accepte les
                <a href="#" class="text-decoration-none">Conditions générales</a>
              </label>
            </div>
            <button
              class="default-btn me-20 transition border-0 fw-medium text-white pt-10 pb-10 ps-25 pe-25 pt-md-11 pb-md-11 ps-md-35 pe-md-35 rounded-1 fs-md-15 fs-lg-16 bg-success"
              type="submit"
            >
                Inscrivez vous maintenant
            </button>
          </Form>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { Form, Field, ErrorMessage } from 'vee-validate';
import * as Yup from 'yup';

export default defineComponent({
    name: "RegisterContent",
    components: {
    Form,
    Field,
    ErrorMessage,
},
  setup: () => {
    const registerSchema = Yup.object().shape({
      nomComplet: Yup.string().required('Le nom est obligatoire'),
      telephone: Yup.string().required('Le numéro téléphone est obligatoire'),
      password: Yup.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/,
        'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'
      ).required('Le mot de passe est obligatoire'),
      password_confirm: Yup.string().required('La confirmation est obligatoire'),
    });

    const registerForm = ref(null);
    const addRegister = async (values) => {
    //
    };
    return { registerSchema, addRegister, registerForm};
  },
});
</script>