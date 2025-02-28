<template>
  <div class="edit-banner">
    <div class="edit-banner-content">
      <p class="edit-banner-text">Would you like to contribute to this document?</p>
      <button class="edit-button" @click="startEditing">
        Edit this document
      </button>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['edit']);

const startEditing = () => {
  emit('edit');
};
</script>

<style scoped>
.edit-banner {
  width: 100%;
  height: 72px;
  border-radius: 20px;
  background: #5377D4;
  padding: 16px 24px;
  margin-bottom: 32px;
}

.edit-banner-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.edit-banner-text {
  color: #FFF;
  font-family: "PP Neue Montreal";
  font-size: 16px;
  font-style: normal;
  font-weight: 375;
  line-height: 24px;
  letter-spacing: 0.15px;
  margin: 0;
}

.edit-button {
  width: 164px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.40);
  background-color: transparent;
  color: #FFF;
  font-family: "PP Neue Montreal";
  font-size: 16px;
  font-style: normal;
  font-weight: 530;
  line-height: 24px;
  letter-spacing: 0.15px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.edit-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style> 