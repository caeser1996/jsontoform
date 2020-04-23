<template>
  <!-- Hide const ? Or make a readonly field -->
  <v-flex v-if="fullSchema && fullSchema.const === undefined && fullSchema['x-display'] !== 'hidden'"
          :id="fullSchema['x-id'] ? fullSchema['x-id'] : null"
          class="vjsf-property"
          :class="fullSchema['x-itemClass'] ? fullSchema['x-itemClass'] : null"
          :style="fullSchema['x-itemStyle'] ? fullSchema['x-itemStyle'] : null"
  >
    <!-- Date picker -->
    <v-menu v-if="fullSchema.type === 'string' && ['date', 'date-time', 'year'].includes(fullSchema.format)" ref="menu"
            v-model="menu" :close-on-content-click="false"
            :nudge-right="40"
            :return-value.sync="modelWrapper[modelKey]"
            :disabled="disabled"
            lazy
            transition="scale-transition"
            offset-y
            full-width
            min-width="290px"
    >
      <template v-if="fullSchema.format !== 'year'">
        <v-text-field
          slot="activator"
          v-model="modelWrapper[modelKey]"
          :label="label"
          :name="fullKey"
          :required="required"
          :rules="rules"
          :clearable="!required"
          prepend-icon="event"
          :readonly="true"
        >
          <v-tooltip v-if="fullSchema.description" slot="append-outer" left>
            <v-icon slot="activator">
              info
            </v-icon>
            <div class="vjsf-tooltip" v-html="htmlDescription" />
          </v-tooltip>
        </v-text-field>
      </template>
      <template v-else>
        <v-text-field
          slot="activator"
          v-model="modelWrapper[modelKey]"
          :label="label"
          :name="fullKey"
          :required="required"
          :rules="rules"
          :clearable="!required"
          prepend-icon="event"
          :readonly="false"
          return-masked-value
          mask="####-01-01"
          @input="(helperModel = modelWrapper[modelKey])"
        >
          <v-tooltip v-if="fullSchema.description" slot="append-outer" left>
            <v-icon slot="activator" @click="(helperModel = modelWrapper[modelKey])">
              info
            </v-icon>
            <div class="vjsf-tooltip" v-html="htmlDescription" />
          </v-tooltip>
        </v-text-field>
      </template>
      <v-date-picker v-if="fullSchema.format !== 'year'" v-model="modelWrapper[modelKey]" no-title scrollable>
        <v-spacer />
        <v-btn flat color="primary" @click="menu = false">
          Cancel
        </v-btn>
        <v-btn flat color="primary" @click="$refs.menu.save(modelWrapper[modelKey]); change(); input()">
          OK
        </v-btn>
      </v-date-picker>
      <v-date-picker
        v-else-if="fullSchema.format === 'year'"
        ref="picker"
        v-model="helperModel"
        show-current
        reactive
        max="2025"
      >
        <v-btn flat color="primary" @click="$refs.menu.save(helperModel); change(); input()">
          OK
        </v-btn>
      </v-date-picker>
    </v-menu>

    <!-- Color picking -->
    <template v-else-if="fullSchema.format === 'hexcolor'">
      <template v-if="fullSchema['x-display'] === 'color-picker'">
        <v-input
          :name="fullKey"
          :label="label"
          :required="required"
          :rules="rules"
          :disabled="disabled"
        >
          <v-tooltip v-if="fullSchema.description" slot="append" left>
            <v-icon slot="activator">
              info
            </v-icon>
            <div class="vjsf-tooltip" v-html="htmlDescription" />
          </v-tooltip>
          &nbsp;&nbsp;
          <v-menu :close-on-content-click="false" :close-on-click="true" direction="bottom" offset-y>
            <template slot="activator">
              <div :style="`background-color: ${modelWrapper[modelKey]};`"
                   :class="modelWrapper[modelKey] ? 'color-picker-trigger' : 'color-picker-trigger color-picker-trigger-empty'"
              />
            </template>
            <color-picker :value="modelWrapper[modelKey]" :preset-colors="options.colors.swatches"
                          @input="(val) => {modelWrapper[modelKey] = val.hex; input(); change()}"
            />
          </v-menu>
        </v-input>
      </template>
      <v-input v-else
               :name="fullKey"
               :label="label"
               :required="required"
               :rules="rules"
               :disabled="disabled"
      >
        <v-tooltip v-if="fullSchema.description" slot="append" left>
          <v-icon slot="activator">
            info
          </v-icon>
          <div class="vjsf-tooltip" v-html="htmlDescription" />
        </v-tooltip>
        &nbsp;&nbsp;
        <swatches
          v-model="modelWrapper[modelKey]"
          :disabled="disabled"
          :colors="options.colors"
          :trigger-style="{width:'36px', height:'36px'}"
          shapes="circles"
          @input="input();change()"
        />
      </v-input>
    </template>

    <!-- Select field based on an enum (array or simple value) -->
    <template v-else-if="(fullSchema.type === 'array' && fullSchema.items.enum) || fullSchema.enum">
      <!--{{ selectItems }}<br>
      {{ modelWrapper[modelKey] }}-->
      <v-select
        v-model="modelWrapper[modelKey]"
        :items="selectItems"
        :name="fullKey"
        :label="label"
        :required="required"
        :rules="rules"
        :disabled="disabled"
        :clearable="!required"
        :multiple="fullSchema.type === 'array'"
        @change="change"
        @input="input"
      >
        <template slot="selection" slot-scope="data">
          <div class="v-select__selection v-select__selection--comma">
            <select-icon v-if="itemIcon" :value="data.item" />
            <span v-if="![null, undefined].includes(data.item)">
              {{ data.item + (fullSchema.type === 'array' && data.index !== modelWrapper[modelKey].length - 1 ? ',&nbsp;' : '') }}
            </span>
          </div>
        </template>
        <template slot="item" slot-scope="data">
          <select-icon v-if="itemIcon" :value="data.item" />
          <v-list-tile-content>
            <v-list-tile-title>{{ data.item }}</v-list-tile-title>
          </v-list-tile-content>
        </template>

        <v-tooltip v-if="fullSchema.description" slot="append-outer" left>
          <v-icon slot="activator">
            info
          </v-icon>
          <div class="vjsf-tooltip" v-html="htmlDescription" />
        </v-tooltip>
      </v-select>
    </template>

    <!-- Select field based on a oneOf on a simple type (array or simple value) -->
    <!-- cf https://github.com/mozilla-services/react-jsonfullSchema-form/issues/532 -->
    <template v-else-if="oneOfSelect">
      <v-select
        v-model="modelWrapper[modelKey]"
        :items="selectItems"
        :name="fullKey"
        :label="label"
        :required="required"
        :disabled="disabled"
        :rules="rules"
        :clearable="!required"
        :multiple="fullSchema.type === 'array'"
        :item-text="itemTitle"
        :item-value="itemKey"
        @change="change"
        @input="input"
      >
        <template slot="selection" slot-scope="data">
          <div class="v-select__selection v-select__selection--comma">
            <select-icon v-if="itemIcon" :value="data.item[itemIcon]" />
            <span v-if="![null, undefined].includes(data.item[itemTitle])" v-html="data.item[itemTitle]">{{ (fullSchema.type === 'array' && data.index !== modelWrapper[modelKey].length - 1 ? ',&nbsp;' : '') }}</span>
          </div>
        </template>
        <template slot="item" slot-scope="data">
          <select-icon v-if="itemIcon" :value="data.item[itemIcon]" />
          <v-list-tile-content>
            <v-list-tile-title v-html="data.item[itemTitle]"></v-list-tile-title>
          </v-list-tile-content>
        </template>

        <v-tooltip v-if="fullSchema.description" slot="append-outer" left>
          <v-icon slot="activator">
            info
          </v-icon>
          <div class="vjsf-tooltip" v-html="htmlDescription" />
        </v-tooltip>
      </v-select>
    </template>

    <!-- Select field on an ajax response or from an array in another part of the data -->
    <v-select v-else-if="fullSchema['x-display'] !== 'list' && (fromUrl || fullSchema['x-fromData'])"
              v-model="modelWrapper[modelKey]"
              :items="selectItems"
              :name="fullKey"
              :label="label"
              :no-data-text="options.noDataMessage"
              :disabled="disabled"
              :required="required"
              :rules="rules"
              :item-text="itemTitle"
              :item-value="itemKey"
              :return-object="(fullSchema.type === 'array' && fullSchema.items.type === 'object') || fullSchema.type === 'object'"
              :clearable="!required"
              :loading="loading"
              :multiple="fullSchema.type === 'array'"
              @change="change"
              @input="input"
    >
      <template slot="selection" slot-scope="data">
        <div class="v-select__selection v-select__selection--comma">
          <select-icon v-if="itemIcon" :value="data.item[itemIcon]" />
          <span v-if="![null, undefined].includes(data.item[itemTitle])">{{ data.item[itemTitle] + (fullSchema.type === 'array' && data.index !== modelWrapper[modelKey].length - 1 ? ',&nbsp;' : '') }}</span>
        </div>
      </template>
      <template slot="item" slot-scope="data">
        <select-icon v-if="itemIcon" :value="data.item[itemIcon]" />
        <v-list-tile-content>
          <v-list-tile-title>{{ yarndata.item[itemTitle] }}</v-list-tile-title>
        </v-list-tile-content>
      </template>

      <v-tooltip v-if="fullSchema.description" slot="append-outer" left>
        <v-icon slot="activator">
          info
        </v-icon>
        <div class="vjsf-tooltip" v-html="htmlDescription" />
      </v-tooltip>
    </v-select>

    <!-- auto-complete field on an ajax response with query -->
    <v-autocomplete v-else-if="fromUrlWithQuery"
                    v-model="modelWrapper[modelKey]"
                    :items="selectItems"
                    :search-input.sync="q"
                    :name="fullKey"
                    :label="label"
                    :no-data-text="options.noDataMessage"
                    :disabled="disabled"
                    :required="required"
                    :rules="rules"
                    :item-text="itemTitle"
                    :item-value="itemKey"
                    :return-object="(fullSchema.type === 'array' && fullSchema.items.type === 'object') || fullSchema.type === 'object'"
                    :clearable="!required"
                    :filter="() => true"
                    :placeholder="options.searchMessage"
                    :loading="loading"
                    :multiple="fullSchema.type === 'array'"
                    @change="change"
                    @input="input"
    >
      <template slot="selection" slot-scope="data">
        <select-icon v-if="itemIcon" :value="data.item[itemIcon]" />
        <div v-if="![null, undefined].includes(data.item[itemTitle])">
          {{ data.item[itemTitle] + (fullSchema.type === 'array' && data.index !== modelWrapper[modelKey].length - 1 ?
            ',&nbsp;' : '') }}
        </div>
      </template>
      <template slot="item" slot-scope="data">
        <select-icon v-if="itemIcon" :value="data.item[itemIcon]" />
        <v-list-tile-content>
          <v-list-tile-title>{{ data.item[itemTitle]  }}</v-list-tile-title>
        </v-list-tile-content>
      </template>

      <v-tooltip v-if="fullSchema.description" slot="append-outer" left>
        <v-icon slot="activator">
          info
        </v-icon>
        <div class="vjsf-tooltip" v-html="htmlDescription" />
      </v-tooltip>
    </v-autocomplete>

    <!-- Long text field in a textarea -->
    <v-textarea
      v-else-if="fullSchema.type === 'string' && (fullSchema.maxLength && fullSchema.maxLength > 1000 && fullSchema['x-display'] !== 'single-line')"
      v-model="modelWrapper[modelKey]"
      :name="fullKey"
      :label="label"
      :disabled="disabled"
      :required="required"
      :rules="rules"
      box
      @change="change"
      @input="input"
    >
      <v-tooltip v-if="fullSchema.description" slot="append-outer" left>
        <v-icon slot="activator">
          info
        </v-icon>
        <div class="vjsf-tooltip" v-html="htmlDescription" />
      </v-tooltip>
    </v-textarea>

    <!-- text field displayed as password -->
    <v-text-field v-else-if="fullSchema.type === 'string' && fullSchema['x-display'] === 'password'"
                  v-model="modelWrapper[modelKey]"
                  :name="fullKey"
                  :label="label"
                  :disabled="disabled"
                  :required="required"
                  :rules="rules"
                  type="password"
                  @change="change"
                  @input="input"
    >
      <v-tooltip v-if="fullSchema.description" slot="append-outer" left>
        <v-icon slot="activator">
          info
        </v-icon>
        <div class="vjsf-tooltip" v-html="htmlDescription" />
      </v-tooltip>
    </v-text-field>

    <!-- Simple text field -->
    <template v-else-if="fullSchema.type === 'string'">
      <v-text-field
        v-model="modelWrapper[modelKey]"
        :name="fullKey"
        :label="label"
        :disabled="disabled"
        :required="required"
        :rules="rules"
        :prepend-icon="fullSchema['x-icon'] ? fullSchema['x-icon'] : null"
        @change="change"
        @input="input"
      >
        <v-tooltip v-if="fullSchema.description" slot="append-outer" left>
          <v-icon slot="activator">
            info
          </v-icon>
          <div class="vjsf-tooltip" v-html="htmlDescription" />
        </v-tooltip>
      </v-text-field>
    </template>

    <!-- Simple number fields -->
    <v-text-field v-else-if="fullSchema.type === 'number' || fullSchema.type === 'integer'"
                  v-model.number="modelWrapper[modelKey]"
                  :name="fullKey"
                  :label="label"
                  :min="fullSchema.minimum"
                  :max="fullSchema.maximum"
                  :step="fullSchema.type === 'integer' ? 1 : 0.01"
                  :disabled="disabled"
                  :required="required"
                  :rules="rules"
                  type="number"
                  @change="change"
                  @input="input"
    >
      <v-tooltip v-if="fullSchema.description" slot="append-outer" left>
        <v-icon slot="activator">
          info
        </v-icon>
        <div class="vjsf-tooltip" v-html="htmlDescription" />
      </v-tooltip>
    </v-text-field>

    <!-- Simple boolean field -->
    <v-checkbox v-else-if="fullSchema.type === 'boolean'"
                v-model="modelWrapper[modelKey]"
                :label="label"
                :name="fullKey"
                :disabled="disabled"
                :required="required"
                :rules="rules"
                @change="change"
                @input="input"
    >
      <v-tooltip v-if="fullSchema.description" slot="append" left>
        <v-icon slot="activator">
          info
        </v-icon>
        <div class="vjsf-tooltip" v-html="htmlDescription" />
      </v-tooltip>
    </v-checkbox>

    <!-- Simple strings array -->
    <v-combobox v-else-if="fullSchema.type === 'array' && fullSchema.items.type === 'string'"
                v-model="modelWrapper[modelKey]"
                :name="fullKey"
                :label="label"
                :required="required"
                :rules="rules"
                :disabled="disabled"
                chips
                multiple
                append-icon=""
                @change="change"
                @input="input"
    >
      <v-tooltip v-if="fullSchema.description" slot="append-outer" left>
        <v-icon slot="activator">
          info
        </v-icon>
        <div class="vjsf-tooltip" v-html="htmlDescription" />
      </v-tooltip>
      <template slot="selection" slot-scope="data">
        <v-chip
          :selected="data.selected"
          close
          @input="modelWrapper[modelKey].splice(modelWrapper[modelKey].indexOf(data.item)); change(); input()"
        >
          {{ data.item }}
        </v-chip>
      </template>
    </v-combobox>

    <!-- Object sub container with properties that may include a select based on a oneOf and subparts base on a allOf -->
    <template v-else-if="fullSchema.type === 'object' && fullSchema.format === 'upload'">
      <v-subheader v-if="fullSchema.title" v-html="fullSchema.title" />
      <p v-if="fullSchema.description" v-html="fullSchema.description" />

      <file-pond
        ref="pond"
        name="test"
        label-idle="Drop files here or click to browse ..."
        allow-multiple="true"
        accepted-file-types="image/jpeg, image/png"
        :server="fakeServer"
        @files="files"
        @init="handleFilePondInit"
        @error="handleFileError"
        @addfile="modelWrapper[modelKey].files = files, handleFileAdd()"
      />
      <template v-if="files.length > 0">
        <div v-for="(itemModel, i) in files" :key="i" class="form-group--inner">
          <span style="display:none;">
            {{ modelWrapper[modelKey].files[i] = {
              name: itemModel.filename,
              file: JSON.parse(readFile(itemModel)),
              meta: modelWrapper[modelKey][i]
            } }}
          </span>
          {{ itemModel.filename }}
          <!--{{ itemModel.getMetadata() }}-->
          <property :schema="fullSchema.properties[0]"
                    :model-wrapper="modelWrapper[modelKey]"
                    :model-root="modelRoot"
                    :model-key="i"
                    :parent-key="`${fullKey}.`"
                    :options="options"
                    class="pa-0"
                    @error="e => $emit('error', e)"
                    @change="e => $emit('change', e)"
                    @input="e => $emit('input', e)"
          />
        </div>
      </template>
    </template>
    <template v-else-if="fullSchema.type === 'object' && (fullSchema['x-format'] === 'triangle' || fullSchema['x-format'] === 'canvas')">
      <v-subheader v-if="fullSchema.title && fullSchema.format !== 'inline'" :style="foldable ? 'cursor:pointer;' :'' "
                   class="mt-2"
                   @click="folded = !folded"
      >
        {{ fullSchema.title }}
        &nbsp;
        <v-icon v-if="foldable && folded">
          arrow_drop_down
        </v-icon>
        <v-icon v-if="foldable && !folded">
          arrow_drop_up
        </v-icon>
      </v-subheader>
      <template v-else>
        <v-subheader v-if="fullSchema.title" v-html="fullSchema.title" />
        <p v-if="fullSchema.description" v-html="fullSchema.description" />
      </template>
      <v-slide-y-transition>
        <v-layout v-show="!foldable || !folded">
          <!--          <p v-if="fullSchema.description" v-html="fullSchema.description" />-->
          <property v-for="childProp in fullSchema.properties" :key="childProp.key"
                    :schema="childProp"
                    :model-wrapper="modelWrapper[modelKey]"
                    :model-root="modelRoot"
                    :model-key="childProp.key"
                    :parent-key="fullKey + '.'"
                    :required="!!(fullSchema.required && fullSchema.required.includes(childProp.key))"
                    :options="options"
                    :readonly="true"
                    style="visibility:hidden;height:0;"
                    @error="e => $emit('error', e)"
                    @change="e => $emit('change', e)"
                    @input="e => $emit('input', e)"
          />
        </v-layout>
      </v-slide-y-transition>
      <v-card color="rgba(255, 255, 255, 0)">
        <v-responsive
          :height="fullSchema.properties['x-height']? fullSchema.properties['x-height'] + 'px' : '360px'"
        >
          <v-stage ref="stage" :style="{marginTop:fullSchema['x-stage-top'] ? fullSchema['x-stage-top'] : '50px'}" class="mx-auto" :config="{
            width: fullSchema['x-stage-width'] ? fullSchema['x-stage-width'] : 360,
            height: fullSchema['x-stage-height'] ? fullSchema['x-stage-height'] : 360
          }"
          >
            <v-layer ref="layer">
              <v-regular-polygon
                :config="{
                  x: fullSchema['x-poly-x'] ? fullSchema['x-poly-x'] : 160,
                  y: fullSchema['x-poly-y'] ? fullSchema['x-poly-y'] : 160,
                  sides: fullSchema['x-poly-sides'] ? fullSchema['x-poly-sides'] : 3,
                  radius: fullSchema['x-poly-radius'] ? fullSchema['x-poly-radius'] : 127,
                  fill: fullSchema['x-poly-fill'] ? fullSchema['x-poly-fill'] : '#ffeb3b',
                  stroke: fullSchema['x-poly-stroke-color'] ? fullSchema['x-poly-stroke-color'] : '#80cbc4',
                  strokeWidth: fullSchema['x-poly-stroke-width'] ? fullSchema['x-poly-stroke-width'] : 2,
                }"
              />
              <v-circle ref="cirlce" :config="{
                x: fullSchema['x-circle-x'] ? fullSchema['x-circle-x'] : 160,
                y: fullSchema['x-circle-y'] ? fullSchema['x-circle-y'] : 160 - 8,
                radius: fullSchema['x-circle-radius'] ? fullSchema['x-circle-radius'] : 16,
                fill: fullSchema['x-circle-fill'] ? fullSchema['x-circle-fill'] : '#80cbc4',
                stroke: fullSchema['x-circle-stroke-color'] ? fullSchema['x-circle-stroke-color'] : '#80cbc4',
                strokeWidth: fullSchema['x-circle-stroke-width'] ? fullSchema['x-circle-stroke-width'] : 0,
                draggable: true
              }" @dragend="handleKovaDrag(fullKey, modelWrapper[modelKey])"
              />
              <v-text v-for="(item, ix) in fullSchema.properties" :key="ix" ref="labels" :config="{
                x: item['x-pos-x'] ? item['x-pos-x'] : (ix !== 1 ? (ix !== 0 ? (ix + 1) * 95 : 140) : 1),
                y: item['x-pos-y'] ? item['x-pos-y'] : (ix !== 1 ? (ix !== 0 ? ix * 100 : 10 ) : 200),
                fontFamily: item['x-font-family'] ? item['x-font-family'] : 'Roboto',
                fontSize: item['x-font-size'] ? item['x-font-size'] : 17,
                fill: item['x-fill'] ? item['x-fill'] : 'black',
                text: item.title ? item.title : item.key
              }"
              />
            </v-layer>
          </v-stage>
        </v-responsive>
        <v-card-text>
          <v-container
            fluid
            grid-list-lg
          >
            <template v-for="(item, i) in fullSchema.properties">
              <v-subheader :key="'head-' + item.key">
                {{ item.title ? item.title : item.key }}
              </v-subheader>
              <v-layout
                :key="'layout-' + item.key"
                row
                wrap
              >
                <v-flex :key="i" xs12>
                  <v-slider
                    v-model="modelWrapper[modelKey][item.key]"
                    :max="250"
                    disabled
                  />
                </v-flex>
              </v-layout>
            </template>
          </v-container>
        </v-card-text>
      </v-card>
    </template>

    <!-- Object sub container with properties that may include a select based on a oneOf and subparts base on a allOf -->
    <template v-else-if="fullSchema.type === 'object'">
      <v-subheader v-if="fullSchema.title && fullSchema.format !== 'inline'" :style="foldable ? 'cursor:pointer;' :'' "
                   class="mt-2"
                   @click="folded = !folded"
      >
        {{ fullSchema.title }}
        &nbsp;
        <v-icon v-if="foldable && folded">
          arrow_drop_down
        </v-icon>
        <v-icon v-if="foldable && !folded">
          arrow_drop_up
        </v-icon>
      </v-subheader>
      <template v-else>
        <v-subheader v-if="fullSchema.title" v-html="fullSchema.title" />
        <p v-if="fullSchema.description" v-html="fullSchema.description" />
      </template>
      <v-slide-y-transition>
        <div v-show="!foldable || !folded" v-if="fullSchema.format !== 'inline'">
          <!--          <p v-if="fullSchema.description" v-html="fullSchema.description" />-->
          <property v-for="childProp in fullSchema.properties" :key="childProp.key"
                    :schema="childProp"
                    :model-wrapper="modelWrapper[modelKey]"
                    :model-root="modelRoot"
                    :model-key="childProp.key"
                    :parent-key="fullKey + '.'"
                    :required="!!(fullSchema.required && fullSchema.required.includes(childProp.key))"
                    :options="options"
                    @error="e => $emit('error', e)"
                    @change="e => $emit('change', e)"
                    @input="e => $emit('input', e)"
          />

          <!-- Sub containers for allOfs -->
          <template v-if="fullSchema.allOf && fullSchema.allOf.length || fullSchema.format === 'expansion' ">
            <template
              v-if="!parentKey && fullSchema.allOf[0].title || fullSchema.title && fullSchema.format === 'expansion'"
            >
              <!-- Accordion / expansion panets at root level -->
              <v-expansion-panel :inset="options.accordionMode === 'inset'" :popout="options.accordionMode === 'popout'"
                                 focusable
                                 :value="fullSchema.allOf.length > 0 ? 0 : null"
              >
                <v-expansion-panel-content v-for="(currentAllOf, i) in fullSchema.allOf" :key="i">
                  <span slot="header" style="font-weight:bold">{{ currentAllOf.title }}</span>
                  <v-card>
                    <v-card-text>
                      <property
                        :schema="Object.assign({}, currentAllOf, {type: 'object', title: null})"
                        :model-wrapper="subModels"
                        :model-root="modelRoot"
                        :model-key="'allOf-' + i"
                        :parent-key="parentKey"
                        :options="options"
                        @error="e => $emit('error', e)"
                        @change="e => $emit('change', e)"
                        @input="e => $emit('input', e)"
                      />
                    </v-card-text>
                  </v-card>
                </v-expansion-panel-content>
              </v-expansion-panel>
            </template>
            <template v-else>
              <!-- simple objects if we are at first level -->
              <property
                v-for="(currentAllOf, i) in (fullSchema.allOf || [])" :key="i"
                :schema="Object.assign({}, currentAllOf, {type: 'object'})"
                :model-wrapper="subModels"
                :model-root="modelRoot"
                :model-key="'allOf-' + i"
                :parent-key="parentKey"
                :options="options"
                @error="e => $emit('error', e)"
                @change="e => $emit('change', e)"
                @input="e => $emit('input', e)"
              />
            </template>
          </template>

          <!-- Sub container with a select for oneOfs -->
          <template v-if="fullSchema.oneOf">
            <v-select

              v-model="currentOneOf"
              :items="fullSchema.oneOf"
              :disabled="disabled"
              :item-value="item => {return oneOfConstProp ? item.properties[oneOfConstProp.key].const : item.title}"
              :label="oneOfConstProp ? (oneOfConstProp.title || oneOfConstProp.key) : 'Type'"
              :required="oneOfRequired"
              :clearable="!oneOfRequired"
              :rules="oneOfRules"
              item-text="title"
              return-object
              @change="change"
              @input="input"
            >
              <v-tooltip v-if="oneOfConstProp && oneOfConstProp.description" slot="append-outer" left>
                <v-icon slot="activator">
                  info
                </v-icon>
                <div class="vjsf-tooltip" v-html="oneOfConstProp.htmlDescription" />
              </v-tooltip>
            </v-select>
            <!--{{ currentOneOf }}-->
            <template v-if="currentOneOf && showCurrentOneOf">
              <property
                :schema="Object.assign({}, currentOneOf, {title: null, type: 'object'})"
                :model-wrapper="subModels"
                :model-root="modelRoot"
                :parent-key="parentKey"
                :options="options"
                model-key="currentOneOf"
                @error="e => $emit('error', e)"
                @change="e => $emit('change', e)"
                @input="e => $emit('input', e)"
              />
            </template>
          </template>
        </div>
        <v-layout v-else-if="fullSchema.format === 'inline'" wrap
                  justify-space-between
        >
          <property v-for="childProp in fullSchema.properties" :key="childProp.key"
                    class="xs12"
                    :schema="childProp"
                    :model-wrapper="modelWrapper[modelKey]"
                    :model-root="modelRoot"
                    :model-key="childProp.key"
                    :parent-key="fullKey + '.'"
                    :required="!!(fullSchema.required && fullSchema.required.includes(childProp.key))"
                    :options="options"
                    @error="e => $emit('error', e)"
                    @change="e => $emit('change', e)"
                    @input="e => $emit('input', e)"
          />
        </v-layout>
      </v-slide-y-transition>
    </template>

    <!-- Tuples array sub container -->
    <template v-else-if="fullSchema.type === 'array' && Array.isArray(fullSchema.items) && fullSchema.format !== 'multiple'">
      <v-subheader v-if="fullSchema.title" :style="foldable ? 'cursor:pointer;' :'' " class="mt-2"
                   @click="folded = !folded"
      >
        {{ fullSchema.title }}
        &nbsp;
        <v-icon v-if="foldable && folded">
          arrow_drop_down
        </v-icon>
        <v-icon v-if="foldable && !folded">
          arrow_drop_up
        </v-icon>
      </v-subheader>
      <v-slide-y-transition>
        <div v-show="!foldable || !folded">
          <p v-if="fullSchema.description" v-html="fullSchema.description" />
          <property v-for="(child, i) in fullSchema.items" :key="i"
                    :schema="child"
                    :model-wrapper="modelWrapper[modelKey]"
                    :model-root="modelRoot"
                    :model-key="i"
                    :parent-key="fullKey + '.'"
                    :options="options"
                    @error="e => $emit('error', e)"
                    @change="e => $emit('change', e)"
                    @input="e => $emit('input', e)"
          />
        </div>
      </v-slide-y-transition>
    </template>

    <!-- Dynamic size array of complex types sub container -->
    <div class="form-group" v-else-if="fullSchema.type === 'array' && fullSchema.format === 'group'">
      <v-form v-if="modelWrapper[modelKey] && modelWrapper[modelKey].length" grid-list-md>
        <v-subheader v-if="fullSchema.title">
          {{ label }}
        </v-subheader>
        <div v-for="(itemModel, i) in modelWrapper[modelKey]" :key="i" class="form-group--inner">
          <property :schema="fullSchema.items"
                    :model-wrapper="modelWrapper[modelKey]"
                    :model-root="modelRoot"
                    :model-key="i"
                    :parent-key="`${fullKey}.`"
                    :options="options"
                    class="pa-0"
                    @error="e => $emit('error', e)"
                    @change="e => $emit('change', e)"
                    @input="e => $emit('input', e)"
          />
        </div>
        <v-layout row class="mt-2 mb-1 pr-1">
          <v-spacer />
          <v-tooltip v-if="fullSchema.description" left>
            <v-icon slot="activator">
              info
            </v-icon>
            <div class="vjsf-tooltip" v-html="htmlDescription" />
          </v-tooltip>
        </v-layout>
      </v-form>
    </div>
    <template v-else-if="fullSchema.type === 'array' && fullSchema.format === 'multiple' ">
      <v-container v-if="modelWrapper[modelKey] && modelWrapper[modelKey].length" grid-list-md class="pt-0 px-0">
        <v-subheader>{{ label }}</v-subheader>
        <v-layout row wrap>
          <draggable v-model="modelWrapper[modelKey]" :options="{handle:'.handle'}" style="width: 100%;">
            <v-flex v-for="(itemModel, i) in modelWrapper[modelKey]" :key="i" xs12>
              <v-card class="array-card">
                <v-card-title primary-title class="pa-0">
                  <v-btn v-if="!disabled && fullSchema['x-sortable'] !== false" flat icon class="handle">
                    <v-icon>drag_indicator</v-icon>
                  </v-btn>
                  <span v-if="itemTitle && modelWrapper[modelKey][i]">{{ modelWrapper[modelKey][i][itemTitle] }}</span>
                  <v-spacer />
                  <v-btn v-if="!disabled && !(fromUrl || fullSchema.fromData) && i > 0" flat icon color="warning"
                         @click="modelWrapper[modelKey].splice(i, 1); change(); input()"
                  >
                    <v-icon>delete</v-icon>
                  </v-btn>
                </v-card-title>
                <v-card-text>
                  <template v-for="(item, idx) in fullSchema.items">
                    <property :key="idx"
                              :schema="item"
                              :model-wrapper="modelWrapper[modelKey]"
                              :model-root="modelRoot"
                              :model-key="i"
                              :parent-key="`${fullKey}.`"
                              :options="options"
                    />
                  </template>
                </v-card-text>
              </v-card>
            </v-flex>
          </draggable>
        </v-layout>
        <v-layout row class="mt-2 mb-1 px-0">
          <v-btn v-if="fullSchema.format === 'multiple'" color="teal lighten-3" primary
                 @click="modelWrapper[modelKey].push(modelWrapper[modelKey][0][0])"
          >
            <v-icon>add</v-icon>
          </v-btn>
          <v-spacer />
          <v-tooltip v-if="fullSchema.description" left>
            <v-icon slot="activator">
              info
            </v-icon>
            <div class="vjsf-tooltip" v-html="htmlDescription" />
          </v-tooltip>
        </v-layout>
      </v-container>
    </template>
    <!-- Dynamic size array of complex types sub container -->
    <template v-else-if="fullSchema.type === 'array'">
      <v-layout row class="mt-2 mb-1 pr-1">
        <v-subheader class="pl-1">
          {{ label }}
          &nbsp;&nbsp;
          <v-tooltip v-if="fullSchema.description" left>
            <v-icon slot="activator">
              info
            </v-icon>
            <div class="vjsf-tooltip" v-html="htmlDescription" />
          </v-tooltip>
        </v-subheader>
      </v-layout>

      <v-container v-if="modelWrapper[modelKey] && modelWrapper[modelKey].length" grid-list-md class="pt-0 px-0">
        <v-layout row wrap>
          <draggable v-model="modelWrapper[modelKey]" :options="{handle:'.handle'}" style="width: 100%;">
            <v-flex v-for="(itemModel, i) in modelWrapper[modelKey]" :key="i" xs12>
              <v-card class="array-card">
                <v-card-title primary-title class="pa-0">
                  <v-btn v-if="!disabled && fullSchema['x-sortable'] !== false" flat icon class="handle">
                    <v-icon>drag_indicator</v-icon>
                  </v-btn>
                  <span v-if="itemTitle && modelWrapper[modelKey][i]">{{ modelWrapper[modelKey][i][itemTitle] }}</span>
                  <v-spacer />
                  <v-btn v-if="!disabled && !(fromUrl || fullSchema.fromData)" flat icon color="warning"
                         @click="modelWrapper[modelKey].splice(i, 1); change(); input()"
                  >
                    <v-icon>delete</v-icon>
                  </v-btn>
                </v-card-title>
                <v-card-text>
                  <property :schema="fullSchema.items"
                            :model-wrapper="modelWrapper[modelKey]"
                            :model-root="modelRoot"
                            :model-key="i"
                            :parent-key="`${fullKey}.`"
                            :options="options"
                            @error="e => $emit('error', e)"
                            @change="e => $emit('change', e)"
                            @input="e => $emit('input', e)"
                  />
                </v-card-text>
              </v-card>
            </v-flex>
          </draggable>
        </v-layout>
      </v-container>

      <v-btn v-if="!disabled && !(fromUrl || fullSchema.fromData)"
             class="ml-0 mb-2"
             color="teal lighten-3"
             @click="modelWrapper[modelKey].push(fullSchema.items.default || defaultValue(fullSchema.items)); change(); input()"
      >
        <v-icon>add</v-icon>
        {{ label }}
      </v-btn>
    </template>
    <p v-else-if="options.debug">
      Unsupported type "{{ fullSchema.type }}" - {{ fullSchema }}
    </p>
  </v-flex>
</template>

<script>
import SelectIcon from './SelectIcon.vue'
import schemaUtils from '../utils/schema'
import selectUtils from '../utils/select'

const matchAll = require('match-all')
const md = require('markdown-it')()

export default {
  name: 'Property',
  components: { SelectIcon },
  props: ['schema', 'modelWrapper', 'modelRoot', 'modelKey', 'parentKey', 'required', 'options'],
  data() {
    return {
      helperModel: null,
      files: [],
      ready: false,
      menu: false,
      rawSelectItems: null,
      selectItems: null,
      q: '',
      currentOneOf: null,
      showCurrentOneOf: true,
      fromUrlParams: {},
      loading: false,
      folded: true,
      showColorPicker: false,
      subModels: {}, // a container for objects from root oneOfs and allOfs
      triangleLabel: {},
      currentKonvaPos: null,
      fakeServer: {
        process: (fieldName, file, metadata, load) => {
          // simulates uploading a file
          console.log(file)
          setTimeout(() => {
            load(Date.now())
            if (file) {
              let files = this.$refs.pond.getFiles()
              this.files = [...files]
              // console.log(files)
              // console.log(this.files)
            }
          })
        },
        load: (source, load) => {
          // simulates loading a file from the server
          fetch(source).then(res => res.blob()).then(load)
          console.log(source.filename)
        }
      }
    }
  },
  computed: {
    fullSchema() {
      return schemaUtils.prepareFullSchema(this.schema, this.modelWrapper, this.modelKey)
    },
    htmlDescription() {
      return (this.fullSchema && this.fullSchema.description) ? md.render(this.fullSchema.description) : null
    },
    fullKey() {
      return (this.parentKey + this.modelKey).replace('root.', '')
    },
    label() {
      return this.fullSchema.title || (typeof this.modelKey === 'string' ? this.modelKey : '')
    },
    rules() {
      return schemaUtils.getRules(this.fullSchema, this.required, this.options)
    },
    fromUrl() {
      return !!(this.fullSchema['x-fromUrl'] && this.fullSchema['x-fromUrl'].indexOf('{q}') === -1)
    },
    fromUrlWithQuery() {
      return !!(this.fullSchema['x-fromUrl'] && this.fullSchema['x-fromUrl'].indexOf('{q}') !== -1)
    },
    fromUrlKeys() {
      // Look for variable parts in the URL used to fetch data
      if (!this.fullSchema['x-fromUrl']) return null
      return matchAll(this.fullSchema['x-fromUrl'], /\{(.*?)\}/g).toArray().filter(key => key !== 'q')
    },
    itemKey() {
      return this.fullSchema['x-itemKey'] || 'key'
    },
    itemTitle() {
      return this.fullSchema['x-itemTitle'] || 'title'
    },
    itemIcon() {
      return this.fullSchema['x-itemIcon'] || (this.fullSchema['x-display'] === 'icon' ? this.itemKey : null)
    },
    disabled() {
      return this.options.disableAll
    },
    foldable() {
      return this.options.autoFoldObjects && this.parentKey && this.fullSchema.title
    },
    oneOfConstProp() {
      if (!this.fullSchema.oneOf) return
      const props = this.fullSchema.oneOf[0].properties
      const key = Object.keys(props).find(p => !!props[p].const)
      if (!key) return
      return { ...props[key], key, htmlDescription: md.render(props[key].description || '') }
    },
    oneOfRequired() {
      return !!(this.oneOfConstProp && this.fullSchema && this.fullSchema.required && this.fullSchema.required.find(r => r === this.oneOfConstProp.key))
    },
    oneOfRules() {
      const rules = []
      if (this.oneOfRequired) rules.push((val) => (val !== undefined && val !== null && val !== '') || this.options.requiredMessage)
      return rules
    },
    oneOfSelect() {
      return schemaUtils.isOneOfSelect(this.fullSchema)
    }
  },
  watch: {
    menu(val) {
      if (val && this.fullSchema.format === 'year') {
        this.$nextTick(
          () => (this.$refs.picker.activePicker = 'YEAR')
        )
      }
    },

    uploads: {
      handler() {
        this.$nextTick(
          () => (console.log(this.uploads))
        )
      }
    },
    q() {
      // This line prevents reloading the list just after selecting an item in an auto-complete
      if (this.modelWrapper[this.modelKey] && this.modelWrapper[this.modelKey][this.itemTitle] === this.q) return
      this.fetchSelectItems()
    },
    fullSchema: {
      handler() {
        if (this.fullSchema && JSON.stringify(this.fullSchema) !== this.lastFullSchema) {
          this.lastFullSchema = JSON.stringify(this.fullSchema)
          // console.log('Schema changed', JSON.stringify(this.fullSchema))
          this.initFromSchema()
          this.cleanUpExtraProperties()
          this.applySubModels()
          this.ready = true
        }
      },
      immediate: true
    },
    currentOneOf(newVal, oldVal) {
      // use this boolean to force removing then re-creating the object property
      // base on the currentOneOf sub schema. If we don't the component is reused and reactivity creates some difficult bugs.
      this.showCurrentOneOf = false
      this.$nextTick(() => {
        this.showCurrentOneOf = true
        if (!this.currentOneOf) this.$set(this.subModels, 'currentOneOf', {})
        this.cleanUpExtraProperties()
      })
    },
    subModels: {
      handler() {
        this.cleanUpExtraProperties()
        this.applySubModels()
      },
      deep: true
    },
    rawSelectItems: {
      handler() {
        this.updateSelectItems()
      },
      immediate: true
    }
  },
  methods: {

    simpleIndex(obj, i) {
      return obj[i]
    },
    removeEmpty(obj) {
      return Object.keys(obj || {}).reduce((x, k) => {
        if (obj[k] != null) {
          x[k] = obj[k]
        }
        return x
      }, {})
    },

    calcDistance(p, q, key, model) {
      const dx = p.x - q.x
      const dy = p.y - q.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      let transformedKey = null
      // console.log(key.replace(/allOf-([0-9]+)\./g, ''))
      // console.log(this.modelWrapper)
      // console.log(model)

      if (key.includes('.')) {
        key.replace(/allOf-([0-9]+)\./g, '')
        transformedKey = key.split('.').reduce(this.simpleIndex, this.modelRoot)
      }

      transformedKey[model] = 280 - dist
    },
    handleKovaDrag(key = null, model = null) {
      const layer = this.$refs.layer.getNode()
      const newPos = layer.children.map(e => e._lastPos)
      this.currentKonvaPos = { ...this.removeEmpty(newPos[1]) }
      for (let i = 0; i < this.$refs.labels.length; i++) {
        this.calcDistance(
          { ...this.currentKonvaPos },
          this.$refs.labels[i].getNode()['attrs'],
          key,
          Object.keys(model)[i]
        )
      }
    },

    readFile(file) {
      let newFile = {
        'lastModified': file.source.lastModified,
        'lastModifiedDate': file.source.lastModifiedDate,
        'name': file.source.name,
        'size': file.source.size,
        'type': file.source.type
      }
      return JSON.stringify(newFile)
    },
    handleFilePondInit: function () {
      if (this.fullSchema.format === 'upload') {
        console.log('FilePond has initialized')
      }
      // FilePond instance methods are available on `this.$refs.pond`
    },
    handleFileError: function () {
      if (this.fullSchema.format === 'upload') {
        console.log('UPPPP')
      }
      console.log('FilePond ERROR')

      // FilePond instance methods are available on `this.$refs.pond`
    },
    handleFileAdd: function () {
      if (this.fullSchema.format === 'upload') {
        console.log('FilePond has added files')
      }
      // FilePond instance methods are available on `this.$refs.pond`
    },

    updateSelectItems() {
      const selectItems = selectUtils.getSelectItems(this.rawSelectItems, this.fullSchema, this.modelWrapper, this.modelKey, this.itemKey)
      if (this.fullSchema['x-display'] === 'list') {
        selectUtils.fillList(this.fullSchema, this.modelWrapper, this.modelKey, selectItems, this.itemKey)
      } else {
        selectUtils.fillSelectItems(this.fullSchema, this.modelWrapper, this.modelKey, selectItems, this.itemKey)
      }

      // we check for actual differences in order to prevent infinite loops
      if (JSON.stringify(selectItems) !== JSON.stringify(this.selectItems)) {
        this.selectItems = selectItems
      }
    },
    change() {
      this.updateSelectItems()
      this.$emit('change', {
        key: this.fullKey.replace(/allOf-([0-9]+)\./g, ''),
        model: this.modelWrapper[this.modelKey]
      })
    },
    input() {
      this.$emit('input', {
        key: this.fullKey.replace(/allOf-([0-9]+)\./g, ''),
        model: this.modelWrapper[this.modelKey]
      })
    },
    defaultValue(schema) {
      if (schema.type === 'object' && !schema['x-fromUrl'] && !schema['x-fromData']) return {}
      if (schema.type === 'array') return []
      return null
    },
    fetchSelectItems() {
      if (!this.options.httpLib) return this.$emit('error', 'No http lib found to perform ajax request')
      let url = this.fullSchema['x-fromUrl'].replace('{q}', this.q || '')
      for (let key of this.fromUrlKeys) {
        // URL parameters are incomplete
        if (this.fromUrlParams[key] === undefined) {
          return
        } else {
          url = url.replace(`{${key}}`, this.fromUrlParams[key])
        }
      }
      this.loading = true
      this.options.httpLib.get(url)
        .then(res => {
          const body = res.data || res.body
          const items = this.fullSchema['x-itemsProp'] ? body[this.fullSchema['x-itemsProp']] : body
          if (!Array.isArray(items)) throw new Error(`Result of http fetch ${url} is not an array`)
          this.rawSelectItems = items
          this.loading = false
        })
        .catch(err => {
          this.$emit('error', err.message)
          this.loading = false
        })
    },
    cleanUpExtraProperties() {
      // console.log('Cleanup extra properties')
      // cleanup extra properties
      if (this.fullSchema.type === 'object' && this.fullSchema.properties && Object.keys(this.fullSchema.properties).length && this.modelWrapper[this.modelKey]) {
        Object.keys(this.modelWrapper[this.modelKey]).forEach(key => {
          if (!this.fullSchema.properties.find(p => p.key === key)) {
            // console.log(`Remove key ${this.modelKey}.${key}`)
            delete this.modelWrapper[this.modelKey][key]
          }
        })
      }
    },
    applySubModels() {
      // console.log('Apply sub models')
      Object.keys(this.subModels).forEach(subModel => {
        Object.keys(this.subModels[subModel]).forEach(key => {
          if (this.modelWrapper[this.modelKey][key] !== this.subModels[subModel][key]) {
            // console.log(`Apply submodel ${this.modelKey}.${key}`, JSON.stringify(this.subModels[subModel][key]))
            this.$set(this.modelWrapper[this.modelKey], key, this.subModels[subModel][key])
          }
        })
      })
    },
    initFromSchema() {
      // console.log('Init from schema')
      let model = this.modelWrapper[this.modelKey]

      // Manage default values
      if (model === undefined) {
        model = this.defaultValue(this.fullSchema)
        if (this.fullSchema.default !== undefined) model = JSON.parse(JSON.stringify(this.fullSchema.default))
      }
      // const always wins
      if (this.fullSchema.const !== undefined) model = this.fullSchema.const

      // color pickers do not like null values
      if (this.fullSchema.type === 'string' && this.fullSchema.format === 'hexcolor') model = model || ''

      // Case of a select based on ajax query
      if (this.fromUrl) this.fetchSelectItems()
      // Case of select based on an enum
      if ((this.fullSchema.type === 'array' && this.fullSchema.items.enum) || this.fullSchema.enum) {
        this.rawSelectItems = this.fullSchema.type === 'array' ? this.fullSchema.items.enum : this.fullSchema.enum
      }
      // Case of select based on a oneof on simple types
      if (this.oneOfSelect) {
        this.rawSelectItems = (this.fullSchema.type === 'array' ? this.fullSchema.items : this.fullSchema).oneOf.map(item => ({
          ...item,
          [this.itemKey]: item.const || (item.enum && item.enum[0]),
          [this.itemTitle]: item.title
        }))
      }
      // Case of an auto-complete field already defined
      if (this.fromUrlWithQuery && model && model[this.itemTitle] !== undefined) {
        this.q = model[this.itemTitle]
      }
      // Case of a select based on an array somewhere in the data
      if (this.fullSchema['x-fromData']) {
        this.$watch('modelRoot.' + this.fullSchema['x-fromData'], (val) => {
          this.rawSelectItems = val
        }, { immediate: true })
      }
      // Watch the dynamic parts of the URL used to fill the select field
      if (this.fromUrlKeys) {
        this.fromUrlKeys.forEach(key => {
          if (key.startsWith('context.')) {
            this.$watch('options.' + key, (val) => {
              this.fromUrlParams[key] = val
              this.fetchSelectItems()
            }, { immediate: true })
          } else {
            this.$watch('modelRoot.' + key, (val) => {
              this.fromUrlParams[key] = val
              this.fetchSelectItems()
            }, { immediate: true })
          }
        })
      }

      // Init subModels for allOf subschemas
      if (this.fullSchema.type === 'object' && this.fullSchema.allOf) {
        this.fullSchema.allOf.forEach((allOf, i) => {
          this.$set(this.subModels, 'allOf-' + i, JSON.parse(JSON.stringify(model)))
        })
      }

      // Case of a sub type selection based on a oneOf
      this.currentOneOf = null
      if (this.fullSchema.type === 'object' && this.fullSchema.oneOf && !this.currentOneOf && this.oneOfConstProp) {
        if (model && model[this.oneOfConstProp.key]) {
          this.currentOneOf = this.fullSchema.oneOf.find(item => item.properties[this.oneOfConstProp.key].const === model[this.oneOfConstProp.key])
        } else if (this.fullSchema.default) {
          this.currentOneOf = this.fullSchema.oneOf.find(item => item.properties[this.oneOfConstProp.key].const === this.fullSchema.default[this.oneOfConstProp.key])
        }
      }

      // Init subModel for current oneOf
      if (this.currentOneOf) {
        this.$set(this.subModels, 'currentOneOf', JSON.parse(JSON.stringify(model)))
      } else {
        this.$set(this.subModels, 'currentOneOf', {})
      }

      // Cleanup arrays of empty items
      if (this.fullSchema.type === 'array' && this.fullSchema.format !== 'multiple') {
        model = model.filter(item => ![undefined, null].includes(item))
      }

      this.$set(this.modelWrapper, this.modelKey, model)
    }
  }
}

</script>

<style lang="css">
  .vjsf-property .array-card .v-card__text {
    padding: 6px 16px 0 16px;
  }

  .vjsf-property .array-card .v-card__actions {
    padding: 0 16px 6px 16px;
  }

  .vjsf-property .v-input--selection-controls {
    margin-top: 0;
  }

  .vjsf-tooltip p:last-child {
    margin-bottom: 0;
  }

  .vjsf-property .color-picker-trigger {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    display: inline-block;
    border: 2px solid #ccc;
  }

  .vjsf-property .color-picker-trigger-empty {
    background: linear-gradient(to top right, transparent 0, transparent calc(50% - 2.4px), #de080a 50%, transparent calc(50% + 2.4px), transparent);
  }

  .v-subheader {
    font-size: 120%;
    padding-left: 0;
  }
  .mx-auto .konvajs-content {
    margin-top: 20px;
    left: 50%;
    transform: translate(-50%);
  }
  .v-text-field__details:empty, .v-messages__wrapper:empty, .vjsf-property:empty {
    display: none;
  }

  .flex.vjsf-property {
    padding: 0;
  }

 .container.grid-list-md .layout .flex.vjsf-property {
    padding: 0;
  }

</style>
