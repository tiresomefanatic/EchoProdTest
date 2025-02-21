<!-- components/Header.vue -->
<template>
  <header class="header">
    <div class="header-content">
      <div class="header-inner">
        <!-- Logo Section -->
        <div class="logo">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="23"
            height="22"
            viewBox="0 0 23 22"
            fill="none"
          >
            <ellipse cx="6" cy="11" rx="6" ry="11" fill="#FF5310" />
            <ellipse cx="11.8429" cy="11" rx="3.84292" ry="11" fill="#FF5310" />
            <ellipse cx="17.0003" cy="11" rx="2.48659" ry="11" fill="#FF5310" />
            <ellipse
              cx="1.40674"
              cy="11"
              rx="1.40674"
              ry="11"
              transform="matrix(-1 0 0 1 22.6914 0)"
              fill="#FF5310"
            />
          </svg>
          <NuxtLink to="/" class="logo-link">ECHO</NuxtLink>
        </div>

        <div class="right-content">
          <!-- Navigation -->
          <nav class="nav">
            <NuxtLink
              v-for="item in navItems"
              :key="item.path"
              :to="item.disabled ? '' : item.path + '/'"
              class="nav-link"
              :class="{
                active: $route.path.startsWith(item.path),
                disabled: item.disabled,
              }"
              @click.prevent="!item.disabled && navigateTo(item.path + '/')"
            >
              {{ item.label }}
              <span v-if="item.disabled" class="lock-icon">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            </NuxtLink>
          </nav>

          <!-- Right Section -->
          <div class="header-right">
            <!-- Search -->
            <div class="search">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M14.3539 13.6464L11.2245 10.5176C12.1315 9.42871 12.5838 8.03201 12.4873 6.6181C12.3908 5.20419 11.7528 3.88193 10.7062 2.92637C9.65963 1.97082 8.28492 1.45555 6.86808 1.48775C5.45125 1.51995 4.10137 2.09714 3.09926 3.09926C2.09714 4.10137 1.51995 5.45125 1.48775 6.86808C1.45555 8.28492 1.97082 9.65963 2.92637 10.7062C3.88193 11.7528 5.20419 12.3908 6.6181 12.4873C8.03201 12.5838 9.42871 12.1315 10.5176 11.2245L13.6464 14.3539C13.6928 14.4003 13.748 14.4372 13.8087 14.4623C13.8694 14.4875 13.9344 14.5004 14.0001 14.5004C14.0658 14.5004 14.1309 14.4875 14.1916 14.4623C14.2523 14.4372 14.3074 14.4003 14.3539 14.3539C14.4003 14.3074 14.4372 14.2523 14.4623 14.1916C14.4875 14.1309 14.5004 14.0658 14.5004 14.0001C14.5004 13.9344 14.4875 13.8694 14.4623 13.8087C14.4372 13.748 14.4003 13.6928 14.3539 13.6464ZM2.50014 7.00014C2.50014 6.11013 2.76406 5.2401 3.25853 4.50008C3.753 3.76006 4.4558 3.18328 5.27807 2.84268C6.10033 2.50209 7.00513 2.41298 7.87805 2.58661C8.75096 2.76024 9.55279 3.18883 10.1821 3.81816C10.8115 4.4475 11.24 5.24932 11.4137 6.12224C11.5873 6.99515 11.4982 7.89995 11.1576 8.72222C10.817 9.54449 10.2402 10.2473 9.50021 10.7418C8.76019 11.2362 7.89016 11.5001 7.00014 11.5001C5.80707 11.4988 4.66325 11.0243 3.81962 10.1807C2.976 9.33704 2.50147 8.19321 2.50014 7.00014Z"
                  fill="#1D1B1B"
                />
              </svg>
              <input
                type="text"
                placeholder="Search"
                class="search-input"
                disabled
              />
              <span class="search-divider">/</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRoute, navigateTo } from "#app";

interface NavItem {
  label: string;
  path: string;
  disabled: boolean;
}

const navItems: NavItem[] = [
  { label: "Design", path: "/design", disabled: false },
  { label: "Develop", path: "/develop", disabled: true },
  { label: "Contribute", path: "/contribute", disabled: true },
  { label: "Options", path: "/options", disabled: true },
];

const route = useRoute();
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  width: 100%;
  height: 56px;
  justify-content: center;
  align-items: center;
  background: rgba(250, 250, 250, 0.60);
  backdrop-filter: blur(27px);
  overflow-x: hidden;
}

.header-content {
  display: flex;
  width: 100%;
  justify-content: center;
}

.header-inner {
  display: flex;
  width: 100%;

  padding: 0 266px;
  height: 56px;
  justify-content: space-between;
  align-items: center;
}

.right-content {
  display: flex;
  align-items: center;
  gap: 32px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-link {
  color: #000;
  font-family: "PP Neue Montreal";
  font-size: 28px;
  font-style: normal;
  font-weight: 450;
  line-height: normal;
  letter-spacing: -0.56px;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo svg {
  width: 22.69px;
  height: 22px;
}

.logo-dot {
  @apply w-2 h-2 bg-orange-500 rounded-full;
}

.nav {
  display: flex;
  align-items: center;
  gap: 16px;
}

.nav-link {
  display: flex;
  padding: 10px;
  justify-content: center;
  align-items: center;
  gap: 8px;
  color: #1D1B1B;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  position: relative;
  opacity: 0.8;
  line-height: 24px;
}

.nav-link.active {
  color: #1D1B1B;
  opacity: 1;
  font-weight: 600;
}

.nav-link.active::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: #FF5310;
}

.nav-link.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.lock-icon {
  display: inline-flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.search {
  display: flex;
  background-color: #FF5310;
  width: 248px;
  height: 32px;
  padding: 8px 14px;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px;
  background: #E6E6E6;
}

.search svg {
  width: 16px;
  height: 16px;
  color: #1D1B1B;
  opacity: 0.7;
}

.search-input {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1 0 0;
  background: transparent;
  border: none;
  outline: none;
  font-size: 16px;
  color: #1D1B1B;
  padding: 0;
}

.search-input::placeholder {
  color: #1D1B1B;
  opacity: 0.7;
}

.search-divider {
  color: #1D1B1B;
  opacity: 0.3;
  font-size: 14px;
}

/* Media Queries */
@media screen and (min-width: 1380px) {
  .header-inner {
    padding: 0 266px;
  }
}

@media screen and (min-width: 1204px) and (max-width: 1379px) {
  .header-inner {
    padding: 0 120px;
  }
}

@media screen and (min-width: 768px) and (max-width: 1203px) {
  .header-inner {
    padding: 0 60px;
  }

  .search {
    width: 200px;
  }
}

@media screen and (max-width: 767px) {
  .header-inner {
    padding: 0 16px;
  }

  .nav {
    display: none;
  }

  .search {
    width: 160px;
  }
}
</style>
