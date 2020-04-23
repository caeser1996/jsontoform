<template lang="html">
  <v-app>
    <v-content>
      <v-container fluid grid-list-md>
        <v-layout row>
          <v-flex xs6>
            <v-form ref="myForm" v-model="formValid">
              <v-container>
                <v-layout align-center justify-space-between row>
                  <v-jsonschema-form
                    v-if="schema"
                    :schema="schema"
                    :model="dataObject"
                    :options="{debug: true, disableAll: false, autoFoldObjects: false, context: {owner: {type: 'organization', id: '5a5dc47163ebd4a6f438589b'}}, accordionMode: 'open'}"
                    @error="e => window.alert(e)"
                    @change="change"
                    @input="input"
                  />
                </v-layout>
              </v-container>
            </v-form>
            <v-btn small @click="submitForm">
              Submit
            </v-btn>
            <h2 class="title my-4">
              Data:
            </h2>
            <pre>{{ JSON.stringify(dataObject, null, 2) }}</pre>
          </v-flex>
        </v-layout>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import VJsonschemaForm from '../lib/index.vue'
import json from './JSON'
import hjson from 'hjson' // more tolerant parsing of the schema for easier UX
import axios from 'axios'
export default {
  components: { VJsonschemaForm },
  data: function() {
    return {
      window,
      schema: null,
      schemaStr: '{}',
      schemaError: null,
      dataObject: {},
      json,
      example: json[1],
      formValid: false
    }
  },
  mounted() {
    this.applyExample()
  },
  methods: {
    submitForm() {
      axios.post('/form_submit', this.dataObject)
        .then(function (response) {
          console.log(response)
        })
        .catch(function (error) {
          console.log(error)
        })
    },
    applySchema() {
      try {
        this.schema = hjson.parse(this.schemaStr)
        this.schemaError = null
      } catch (err) {
        this.schemaError = err
      }
    },
    formatSchema() {
      try {
        const schema = hjson.parse(this.schemaStr)
        this.schemaStr = JSON.stringify(schema, null, 2)
        this.schemaError = null
      } catch (err) {
        this.schemaError = err
      }
    },
    applyExample() {
      this.schema = null
      setTimeout(() => {
        this.dataObject = JSON.parse(JSON.stringify(this.example.data || {}))
        this.schemaStr = JSON.stringify(this.example.schema, null, 2)
        this.applySchema()
      }, 1)
    },
    change(e) {
      console.log('"change" event', e)
    },
    input(e) {
      console.log('"input" event', e)
    }
  }
}
</script>

<style lang="css">
</style>
