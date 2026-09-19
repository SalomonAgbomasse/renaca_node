# Guide d'utilisation des validations de dates pour les contrats

Ce fichier contient des fonctions utilitaires réutilisables pour valider les dates des contrats.

## Fonctions disponibles

### 1. Fonctions de validation

#### `isDatePremiereEcheanceValid(datePremiereEcheance, dateEffet)`
Vérifie si la date de première échéance est valide (>= date d'effet).

```typescript
import { isDatePremiereEcheanceValid } from '@/utils/dateValidations';

const isValid = isDatePremiereEcheanceValid('2024-02-01', '2024-01-01');
// Retourne true si valide, false sinon
```

#### `isDateEcheanceValid(dateEcheance, datePremiereEcheance)`
Vérifie si la date d'échéance est valide (> date de première échéance).

```typescript
import { isDateEcheanceValid } from '@/utils/dateValidations';

const isValid = isDateEcheanceValid('2024-03-01', '2024-02-01');
// Retourne true si valide, false sinon
```

### 2. Fonctions de correction

#### `correctDatePremiereEcheance(datePremiereEcheance, dateEffet)`
Corrige automatiquement la date de première échéance si elle est invalide.

```typescript
import { correctDatePremiereEcheance } from '@/utils/dateValidations';

const corrected = correctDatePremiereEcheance('2023-12-01', '2024-01-01');
// Retourne '2024-01-01' (date d'effet) car la date était invalide
```

#### `correctDateEcheance(dateEcheance, datePremiereEcheance)`
Corrige automatiquement la date d'échéance si elle est invalide.

```typescript
import { correctDateEcheance } from '@/utils/dateValidations';

const corrected = correctDateEcheance('2024-02-01', '2024-02-01');
// Retourne '2024-02-02' (date de première échéance + 1 jour)
```

### 3. Fonctions utilitaires

#### `getMinDateEcheance(datePremiereEcheance?, dateEffet?, todayDate?)`
Calcule la date minimale pour un champ de date d'échéance.

```typescript
import { getMinDateEcheance } from '@/utils/dateValidations';

const minDate = getMinDateEcheance('2024-02-01', '2024-01-01', '2024-01-15');
// Retourne '2024-02-02' (date de première échéance + 1 jour)
```

### 4. Handlers pour les événements

#### `handleValidateDatePremiereEcheance(event, formData, onCorrected?)`
Handler à utiliser avec `@change` sur un champ de date de première échéance.

```vue
<template>
  <Field
    name="contrat.datePremiereEcheance"
    v-model="form.contrat.datePremiereEcheance"
    type="date"
    @change="handleDatePremiereEcheanceChange"
  />
</template>

<script setup>
import { handleValidateDatePremiereEcheance } from '@/utils/dateValidations';

const form = ref({
  contrat: {
    dateEffet: '2024-01-01',
    datePremiereEcheance: ''
  }
});

const handleDatePremiereEcheanceChange = (event) => {
  handleValidateDatePremiereEcheance(
    event,
    {
      dateEffet: form.value.contrat.dateEffet,
      datePremiereEcheance: form.value.contrat.datePremiereEcheance
    },
    (correctedDate) => {
      form.value.contrat.datePremiereEcheance = correctedDate;
      // Faire d'autres actions si nécessaire (ex: recalculer la date d'échéance)
    }
  );
};
</script>
```

#### `handleValidateDateEcheance(event, formData, onCorrected?)`
Handler à utiliser avec `@change` sur un champ de date d'échéance.

```vue
<template>
  <Field
    name="contrat.dateEch1"
    v-model="form.contrat.dateEch1"
    type="date"
    :min="minDateEcheance"
    @change="handleDateEcheanceChange"
  />
</template>

<script setup>
import { handleValidateDateEcheance, getMinDateEcheance } from '@/utils/dateValidations';

const form = ref({
  contrat: {
    datePremiereEcheance: '2024-02-01',
    dateEch1: ''
  }
});

const minDateEcheance = computed(() => {
  return getMinDateEcheance(
    form.value.contrat.datePremiereEcheance,
    form.value.contrat.dateEffet
  );
});

const handleDateEcheanceChange = (event) => {
  handleValidateDateEcheance(
    event,
    {
      datePremiereEcheance: form.value.contrat.datePremiereEcheance,
      dateEch1: form.value.contrat.dateEch1
    },
    (correctedDate) => {
      form.value.contrat.dateEch1 = correctedDate;
    }
  );
};
</script>
```

### 5. Schémas Yup réutilisables

#### `dateEffetSchema`
Schéma Yup pour valider la date d'effet.

```typescript
import { dateEffetSchema } from '@/utils/dateValidations';
import * as Yup from 'yup';

const schema = Yup.object().shape({
  contrat: Yup.object().shape({
    dateEffet: dateEffetSchema,
    // ... autres champs
  })
});
```

#### `datePremiereEcheanceSchema(parentPath?)`
Schéma Yup pour valider la date de première échéance.

```typescript
import { datePremiereEcheanceSchema } from '@/utils/dateValidations';
import * as Yup from 'yup';

// Si dateEffet est dans le même objet
const schema = Yup.object().shape({
  dateEffet: dateEffetSchema,
  datePremiereEcheance: datePremiereEcheanceSchema()
});

// Si dateEffet est dans un objet parent 'contrat'
const schema = Yup.object().shape({
  contrat: Yup.object().shape({
    dateEffet: dateEffetSchema,
    datePremiereEcheance: datePremiereEcheanceSchema('contrat')
  })
});
```

#### `dateEcheanceSchema(parentPath?)`
Schéma Yup pour valider la date d'échéance.

```typescript
import { dateEcheanceSchema } from '@/utils/dateValidations';
import * as Yup from 'yup';

// Si datePremiereEcheance est dans le même objet
const schema = Yup.object().shape({
  datePremiereEcheance: datePremiereEcheanceSchema(),
  dateEch1: dateEcheanceSchema()
});

// Si datePremiereEcheance est dans un objet parent 'contrat'
const schema = Yup.object().shape({
  contrat: Yup.object().shape({
    datePremiereEcheance: datePremiereEcheanceSchema('contrat'),
    dateEch1: dateEcheanceSchema('contrat')
  })
});
```

## Exemple complet

```vue
<template>
  <Form :validation-schema="schema" @submit="handleSubmit">
    <Field
      name="contrat.dateEffet"
      v-model="form.contrat.dateEffet"
      type="date"
      :min="todayDate"
      @change="handleDateEffetChange"
    />
    <ErrorMessage name="contrat.dateEffet" />
    
    <Field
      name="contrat.datePremiereEcheance"
      v-model="form.contrat.datePremiereEcheance"
      type="date"
      :min="form.contrat.dateEffet || todayDate"
      @change="handleDatePremiereEcheanceChange"
    />
    <ErrorMessage name="contrat.datePremiereEcheance" />
    
    <Field
      name="contrat.dateEch1"
      v-model="form.contrat.dateEch1"
      type="date"
      :min="minDateEcheance"
      @change="handleDateEcheanceChange"
    />
    <ErrorMessage name="contrat.dateEch1" />
  </Form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Form, Field, ErrorMessage } from 'vee-validate';
import * as Yup from 'yup';
import {
  dateEffetSchema,
  datePremiereEcheanceSchema,
  dateEcheanceSchema,
  handleValidateDatePremiereEcheance,
  handleValidateDateEcheance,
  getMinDateEcheance
} from '@/utils/dateValidations';

const form = ref({
  contrat: {
    dateEffet: '',
    datePremiereEcheance: '',
    dateEch1: ''
  }
});

const todayDate = computed(() => {
  return new Date().toISOString().split('T')[0];
});

const minDateEcheance = computed(() => {
  return getMinDateEcheance(
    form.value.contrat.datePremiereEcheance,
    form.value.contrat.dateEffet,
    todayDate.value
  );
});

const schema = Yup.object().shape({
  contrat: Yup.object().shape({
    dateEffet: dateEffetSchema,
    datePremiereEcheance: datePremiereEcheanceSchema('contrat'),
    dateEch1: dateEcheanceSchema('contrat')
  })
});

const handleDateEffetChange = () => {
  // Recalculer la date de première échéance si nécessaire
};

const handleDatePremiereEcheanceChange = (event: Event) => {
  handleValidateDatePremiereEcheance(
    event,
    {
      dateEffet: form.value.contrat.dateEffet,
      datePremiereEcheance: form.value.contrat.datePremiereEcheance
    },
    (correctedDate) => {
      form.value.contrat.datePremiereEcheance = correctedDate;
    }
  );
};

const handleDateEcheanceChange = (event: Event) => {
  handleValidateDateEcheance(
    event,
    {
      datePremiereEcheance: form.value.contrat.datePremiereEcheance,
      dateEch1: form.value.contrat.dateEch1
    },
    (correctedDate) => {
      form.value.contrat.dateEch1 = correctedDate;
    }
  );
};

const handleSubmit = (values: any) => {
  console.log('Formulaire soumis:', values);
};
</script>
```

## Notes importantes

1. **Format des dates** : Toutes les dates doivent être au format `YYYY-MM-DD`
2. **Comparaison stricte** : La date d'échéance doit être **strictement supérieure** (> et non >=) à la date de première échéance
3. **Parent path** : Pour les schémas Yup, utilisez le paramètre `parentPath` si les dates sont dans un objet imbriqué (ex: `'contrat'` pour `form.contrat.dateEffet`)
4. **Correction automatique** : Les handlers corrigent automatiquement les dates invalides et affichent un message d'erreur

