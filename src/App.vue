<script setup>
import { computed, h, reactive, ref } from 'vue'
import { NButton, NSpace, NTag, useMessage } from 'naive-ui'
import { supabase, isSupabaseConfigured } from './lib/supabase'

const message = useMessage()
const orders = ref([])
const keyword = ref('')
const isLoading = ref(false)
const isSaving = ref(false)
const showModal = ref(false)
const editingId = ref(null)
const errorText = ref('')

const statusType = computed(() => (isSupabaseConfigured ? 'success' : 'warning'))
const modalTitle = computed(() => (editingId.value ? '编辑订单' : '新建订单'))

const formState = reactive(createEmptyForm())
const platformOptions = [
  { label: '美团', value: '1' }
]

const columns = [
  {
    title: 'ID',
    key: 'id',
    width: 72
  },
  {
    title: '平台',
    key: 'platform',
    width: 100,
    render(row) {
      return formatPlatform(row.platform)
    }
  },
  {
    title: '取餐简称',
    key: 'pickup_address_short',
    minWidth: 140
  },
  {
    title: '取餐地址',
    key: 'pickup_address',
    minWidth: 220
  },
  {
    title: '送达地址',
    key: 'delivery_address',
    minWidth: 220,
    render(row) {
      return row.delivery_address || '-'
    }
  },
  {
    title: '配送费',
    key: 'delivery_fee',
    width: 100,
    render(row) {
      return formatMoney(row.delivery_fee)
    }
  },
  {
    title: '是否超时',
    key: 'is_late',
    width: 100,
    render(row) {
      return row.is_late ? '是' : '否'
    }
  },
  {
    title: '门禁',
    key: 'has_access_control',
    width: 100,
    render(row) {
      return h(
        NTag,
        {
          type: row.has_access_control ? 'error' : 'success',
          round: true,
          size: 'small'
        },
        {
          default: () => (row.has_access_control ? '有门禁' : '无门禁')
        }
      )
    }
  },
  {
    title: '可进小区',
    key: 'can_enter_community',
    width: 100,
    render(row) {
      return h(
        NTag,
        {
          type: row.can_enter_community ? 'success' : 'error',
          round: true,
          size: 'small'
        },
        {
          default: () => (row.can_enter_community ? '可进入' : '不可进')
        }
      )
    }
  },
  {
    title: '接单时间',
    key: 'accept_time',
    width: 180,
    render(row) {
      return formatDateTime(row.accept_time)
    }
  },
  {
    title: '送达时间',
    key: 'delivery_time',
    width: 180,
    render(row) {
      return formatDateTime(row.delivery_time)
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 170,
    fixed: 'right',
    render(row) {
      return h(
        NSpace,
        { size: 8 },
        {
          default: () => [
            h(
              NButton,
              {
                size: 'small',
                secondary: true,
                onClick: () => openEditModal(row)
              },
              { default: () => '编辑' }
            ),
            h(
              NButton,
              {
                size: 'small',
                type: 'error',
                secondary: true,
                onClick: () => deleteOrder(row.id)
              },
              { default: () => '删除' }
            )
          ]
        }
      )
    }
  }
]

function createEmptyForm() {
  return {
    platform: null,
    pickup_address_short: '',
    pickup_address: '',
    delivery_address: '',
    pickup_distance: null,
    delivery_distance: null,
    floor: null,
    can_enter_community: false,
    has_access_control: false,
    accept_time: null,
    arrive_store_time: null,
    pickup_time: null,
    delivery_time: null,
    is_late: false,
    delivery_fee: null
  }
}

function resetForm() {
  Object.assign(formState, createEmptyForm())
}

function populateForm(row) {
  Object.assign(formState, {
    platform: row.platform ? String(row.platform) : null,
    pickup_address_short: row.pickup_address_short || '',
    pickup_address: row.pickup_address || '',
    delivery_address: row.delivery_address || '',
    pickup_distance: row.pickup_distance,
    delivery_distance: row.delivery_distance,
    floor: row.floor,
    can_enter_community: Boolean(row.can_enter_community),
    has_access_control: Boolean(row.has_access_control),
    accept_time: toTimestamp(row.accept_time),
    arrive_store_time: toTimestamp(row.arrive_store_time),
    pickup_time: toTimestamp(row.pickup_time),
    delivery_time: toTimestamp(row.delivery_time),
    is_late: Boolean(row.is_late),
    delivery_fee: row.delivery_fee
  })
}

function toTimestamp(value) {
  if (!value) return null
  return new Date(value).getTime()
}

function toIsoString(value) {
  if (!value) return null
  return new Date(value).toISOString()
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN', {
    hour12: false
  })
}

function formatMoney(value) {
  if (value === null || value === undefined) return '-'
  return `¥${Number(value).toFixed(2)}`
}

function formatPlatform(value) {
  if (value === '1' || value === 1) return '美团'
  return value || '-'
}

function openCreateModal() {
  editingId.value = null
  resetForm()
  errorText.value = ''
  showModal.value = true
}

function openEditModal(row) {
  editingId.value = row.id
  populateForm(row)
  errorText.value = ''
  showModal.value = true
}

function buildPayload() {
  return {
    platform: formState.platform || '',
    pickup_address_short: formState.pickup_address_short.trim(),
    pickup_address: formState.pickup_address.trim(),
    delivery_address: formState.delivery_address.trim() || null,
    pickup_distance: formState.pickup_distance,
    delivery_distance: formState.delivery_distance,
    floor: formState.floor,
    can_enter_community: formState.can_enter_community,
    has_access_control: formState.has_access_control,
    accept_time: toIsoString(formState.accept_time),
    arrive_store_time: toIsoString(formState.arrive_store_time),
    pickup_time: toIsoString(formState.pickup_time),
    delivery_time: toIsoString(formState.delivery_time),
    is_late: formState.is_late,
    delivery_fee: formState.delivery_fee
  }
}

function validateForm() {
  if (!formState.pickup_address_short.trim()) return '请填写 pickup_address_short'
  if (!formState.pickup_address.trim()) return '请填写 pickup_address'
  if (!formState.accept_time) return '请填写 accept_time'
  if (!formState.arrive_store_time) return '请填写 arrive_store_time'
  if (!formState.pickup_time) return '请填写 pickup_time'
  if (!formState.delivery_time) return '请填写 delivery_time'
  if (formState.delivery_fee === null || formState.delivery_fee === undefined) return '请填写 delivery_fee'
  return ''
}

async function loadOrders() {
  if (!isSupabaseConfigured) {
    orders.value = []
    errorText.value = '请先在 .env 中配置 Supabase URL 和匿名密钥'
    return
  }

  isLoading.value = true
  errorText.value = ''

  let query = supabase.from('delivery_orders').select('*').order('created_at', { ascending: false })

  if (keyword.value.trim()) {
    const term = keyword.value.trim()
    query = query.or(`platform.ilike.%${term}%,pickup_address_short.ilike.%${term}%,pickup_address.ilike.%${term}%`)
  }

  const { data, error } = await query

  if (error) {
    errorText.value = error.message
    orders.value = []
    message.error('加载订单失败，请检查表权限或查询条件')
  } else {
    orders.value = data || []
  }

  isLoading.value = false
}

async function saveOrder() {
  const validationMessage = validateForm()
  if (validationMessage) {
    message.warning(validationMessage)
    return
  }

  isSaving.value = true
  errorText.value = ''

  const payload = buildPayload()
  const query = editingId.value
    ? supabase.from('delivery_orders').update(payload).eq('id', editingId.value)
    : supabase.from('delivery_orders').insert(payload)

  const { error } = await query

  if (error) {
    errorText.value = error.message
    message.error(editingId.value ? '更新订单失败' : '创建订单失败')
  } else {
    showModal.value = false
    message.success(editingId.value ? '订单已更新' : '订单已创建')
    await loadOrders()
  }

  isSaving.value = false
}

async function deleteOrder(id) {
  if (!window.confirm(`确认删除订单 #${id} 吗？`)) {
    return
  }

  const { error } = await supabase.from('delivery_orders').delete().eq('id', id)

  if (error) {
    message.error(`删除失败：${error.message}`)
    return
  }

  message.success('订单已删除')
  await loadOrders()
}

loadOrders()
</script>

<template>
  <n-layout class="page-shell">
    <n-layout-content class="page-content">
      <n-space vertical size="large">
        <n-card class="hero-card toolbar-card" :bordered="false">
          <div class="toolbar-row">
            <div class="toolbar-copy">
              <n-text strong style="font-size: 18px;">
                订单列表
              </n-text>
              <n-text depth="3">
                支持按平台、取餐简称、取餐地址模糊搜索
              </n-text>
            </div>

            <div class="toolbar-actions">
              <n-input
                v-model:value="keyword"
                class="search-input"
                placeholder="搜索平台 / 取餐简称 / 取餐地址"
                @keydown.enter="loadOrders"
              />
              <n-button secondary :loading="isLoading" @click="loadOrders">
                搜索
              </n-button>
              <n-button type="primary" @click="openCreateModal">
                新建订单
              </n-button>
            </div>
          </div>

          <n-text v-if="errorText" type="error">
            {{ errorText }}
          </n-text>
        </n-card>

        <n-card class="hero-card glass-card data-card" :bordered="false">
          <n-data-table
            :columns="columns"
            :data="orders"
            :loading="isLoading"
            :pagination="{ pageSize: 10 }"
            :row-key="(row) => row.id"
            scroll-x="1480"
          />
        </n-card>
      </n-space>

      <n-modal
        v-model:show="showModal"
        preset="card"
        class="order-modal"
        :title="modalTitle"
        :bordered="false"
        size="huge"
      >
        <n-form label-placement="top" class="order-form">
          <div class="form-grid">
            <n-form-item label="投放平台">
              <n-select
                v-model:value="formState.platform"
                :options="platformOptions"
                class="field-full"
                clearable
                placeholder="请选择投放平台"
              />
            </n-form-item>

            <n-form-item label="配送费" required>
              <n-input-number
                v-model:value="formState.delivery_fee"
                :min="0"
                :precision="2"
                class="field-full"
                placeholder="输入配送费"
              />
            </n-form-item>

            <n-form-item label="取餐简称" required>
              <n-input v-model:value="formState.pickup_address_short" placeholder="输入 pickup_address_short" />
            </n-form-item>

            <n-form-item label="楼层">
              <n-input-number
                v-model:value="formState.floor"
                :precision="0"
                class="field-full"
                placeholder="输入楼层"
              />
            </n-form-item>

            <n-form-item label="取餐地址" required class="span-2">
              <n-input v-model:value="formState.pickup_address" type="textarea" :rows="2" placeholder="输入 pickup_address" />
            </n-form-item>

            <n-form-item label="送达地址" class="span-2">
              <n-input v-model:value="formState.delivery_address" type="textarea" :rows="2" placeholder="输入 delivery_address" />
            </n-form-item>

            <n-form-item label="取餐距离 (km)">
              <n-input-number
                v-model:value="formState.pickup_distance"
                :min="0"
                :precision="2"
                class="field-full"
                placeholder="输入 pickup_distance"
              />
            </n-form-item>

            <n-form-item label="送餐距离 (km)">
              <n-input-number
                v-model:value="formState.delivery_distance"
                :min="0"
                :precision="2"
                class="field-full"
                placeholder="输入 delivery_distance"
              />
            </n-form-item>

            <n-form-item label="接单时间" required>
              <n-date-picker v-model:value="formState.accept_time" type="datetime" class="field-full" clearable />
            </n-form-item>

            <n-form-item label="到店时间" required>
              <n-date-picker v-model:value="formState.arrive_store_time" type="datetime" class="field-full" clearable />
            </n-form-item>

            <n-form-item label="取餐时间" required>
              <n-date-picker v-model:value="formState.pickup_time" type="datetime" class="field-full" clearable />
            </n-form-item>

            <n-form-item label="送达时间" required>
              <n-date-picker v-model:value="formState.delivery_time" type="datetime" class="field-full" clearable />
            </n-form-item>

            <n-form-item label="可进小区">
              <n-switch v-model:value="formState.can_enter_community" />
            </n-form-item>

            <n-form-item label="有门禁">
              <n-switch v-model:value="formState.has_access_control" />
            </n-form-item>

            <n-form-item label="是否超时">
              <n-switch v-model:value="formState.is_late" />
            </n-form-item>
          </div>
        </n-form>

        <template #action>
          <n-space justify="end">
            <n-button @click="showModal = false">
              取消
            </n-button>
            <n-button type="primary" :loading="isSaving" @click="saveOrder">
              保存
            </n-button>
          </n-space>
        </template>
      </n-modal>
    </n-layout-content>
  </n-layout>
</template>
