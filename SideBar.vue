<template>
  <div
    :class="{ sidebar: true, collapsed: isCollapsed }"
    @mouseenter="highlight = true"
    @mouseleave="highlight = false"
    :style="dragStyle">
    <div
      class="drag-handle"
      @mousedown="startDrag"
      :class="{ highlight }"></div>
    <div class="sidebar-inner">
      <n-button
        @click="isCollapsed = !isCollapsed"
        circle
        size="small"
        style="margin-bottom: 12px">
        <n-icon
          :component="
            isCollapsed ? ArrowHookUpRight24Filled : ArrowHookUpLeft24Filled
          " />
      </n-button>
      <template v-if="!isCollapsed">
        <n-switch v-model:value="switchState" />
        <p style="margin-top: 8px">Test Toggle</p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowHookUpLeft24Filled,
  ArrowHookUpRight24Filled
} from "@vicons/fluent"
import { NButton, NIcon, NSwitch } from "naive-ui"
import { reactive, ref } from "vue"

const isCollapsed = ref(true)
const switchState = ref(false)
const highlight = ref(false)

// Position + Drag logic
const position = reactive({ left: 0, top: 100 })

const dragStyle = reactive({
  position: "fixed",
  left: `${position.left}px`,
  top: `${position.top}px`
})

let isDragging = false
let startX = 0,
  startY = 0,
  startLeft = 0,
  startTop = 0

function startDrag(e: MouseEvent) {
  isDragging = true
  startX = e.clientX
  startY = e.clientY
  startLeft = parseInt(dragStyle.left)
  startTop = parseInt(dragStyle.top)
  document.addEventListener("mousemove", onDrag)
  document.addEventListener("mouseup", stopDrag)
}

function onDrag(e: MouseEvent) {
  if (!isDragging) return
  dragStyle.left = `${startLeft + (e.clientX - startX)}px`
  dragStyle.top = `${startTop + (e.clientY - startY)}px`
}

function stopDrag() {
  isDragging = false
  document.removeEventListener("mousemove", onDrag)
  document.removeEventListener("mouseup", stopDrag)
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  width: 220px;
  height: auto;
  z-index: 999999;
  background: white;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.15);
  transition: width 0.3s ease;
  border-radius: 0 4px 4px 0;
  padding: 10px;
}
.collapsed {
  width: 48px;
  overflow: hidden;
}
.sidebar-inner {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.drag-handle {
  width: 8px;
  height: 100%;
  cursor: ew-resize;
  position: absolute;
  left: 0;
  top: 0;
}
.drag-handle.highlight {
  background-color: #60aafc44;
}
</style>