<script lang="ts" setup>
const { docTitle, rawText, docs, currentDocId } = storeToRefs(useStore());

interface Emits {
    (event: 'toggle-menu', value: boolean): void;
    (event: 'toggle-delete-modal', value: boolean): void;
}
const emits = defineEmits<Emits>();

const isMenuOpen = ref(false);

const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value;
    emits('toggle-menu', isMenuOpen.value);
};

const toggleDeleteModal = () => {
    if (rawText.value) return emits('toggle-delete-modal', true);
}

const save = async() => {
    if (!rawText.value) return;
    const { addDoc, saveDoc, getDocs } = useMdDocs();
    // check if doc already exists
    const doc: Doc = docs.value.find((doc: Doc) => doc.id === currentDocId.value)!;
    const docObj: Doc = { id: "", title: docTitle.value, content: rawText.value, created: new Date().toISOString() };
    if (doc) {
        docObj.id = doc.id;
        docObj.created = doc.created;
        await saveDoc(docObj);
    } else {
        docObj.id = window.crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
        await addDoc(docObj);
    }
    docs.value = await getDocs();
};
</script>

<template>
    <header class="w-100 d-flex align-items-center">
        <div class="left d-flex align-items-center gap-5">
            <button class="menu" @click="toggleMenu">
                <IconsMenu :variant="isMenuOpen ? 'close' : 'open'" />
            </button>
            <IconsLogo class="logo w-100" />
            <hr />
            <FileRename />
        </div>

        <div class="right d-flex align-items-center gap-9">
            <button class="delete" @click="toggleDeleteModal">
                <IconsDelete />
            </button>
            <ButtonsSave @save-changes="save" />
        </div>
    </header>
</template>

<style lang="scss" scoped>
@use "@/assets/scss/utils/_mixins.scss" as *;
@use "@/assets/scss/main.scss" as *;

header {
    height: 7.2rem;
    justify-content: space-between;
    background: $col-darkCyanBlue;

    .left {
        .menu {
            height: 7.2rem;
            width: 12rem;
            background: $col-darkGrayishBlue;
            color: $col-white;
            transition: background 0.2s ease-in-out;

            &:hover {
                background: $col-redOrange;
            }

            @media (max-width: 550px) {
                width: 7.2rem;
            }
        }

        .logo {
            max-width: 12rem;
            margin-left: 2.4rem;

            @media (max-width: 768px) {
                display: none;
            }
        }

        hr {
            height: 4rem;
            width: 1px;
            background: $col-lightCyanBlue;
            border: none;
            margin: 0 2.4rem;

            @media (max-width: 768px) {
                display: none;
            }
        }
    }

    .right {
        padding-right: 1.5rem;

        .delete {
            color: $col-lightCyanBlue;
            transition: color 0.2s ease-in-out;

            &:hover {
                color: $col-redOrange;
            }
        }
    }
}
</style>
