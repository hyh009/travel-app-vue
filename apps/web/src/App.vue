<script setup lang="ts">
import { mdiMapMarker } from '@mdi/js'
</script>

<template>
  <v-app>
    <v-main>
      <v-btn color="primary" :prepend-icon="mdiMapMarker">Vuetify works</v-btn>
      <v-rating model-value="4" readonly />
    </v-main>
  </v-app>
</template>
