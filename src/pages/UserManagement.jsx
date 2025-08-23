import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Input, message, 
  Popconfirm, Select, Image
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  RedoOutlined
} from '@ant-design/icons';
import { fetchUsers, createUser, updateUser, deleteUser, resetUserPassword, fetchRoles } from '../services/api';
import { convertArrayTimeFields } from '../utils/timeUtils';

const { Option } = Select;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [form] = Form.useForm();
  
  const fetchUsers2 = async (searchParams = {}) => {
    setLoading(true);
    try {
      const data = await fetchUsers(searchParams);
      // 确保data是数组
      if (Array.isArray(data)) {
        // 格式化时间字段
        const formattedData = convertArrayTimeFields(data);
        setUsers(formattedData);
      } else {
        console.error('获取的用户数据不是数组:', data);
        setUsers([]);
      }
    } catch (error) {
      console.error('获取用户数据失败:', error);
      message.error('获取用户数据失败: ' + error.message);
      // 出错时设置为空数组
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUsers2();
    fetchRoles2();
  }, []);
  
  const fetchRoles2 = async () => {
    try {
      const data = await fetchRoles();
      // 确保data是数组
      if (Array.isArray(data)) {
        setRoles(data);
      } else {
        console.error('获取的角色数据不是数组:', data);
        setRoles([]);
      }
    } catch (error) {
      console.error('获取角色数据失败:', error);
      message.error('获取角色数据失败: ' + error.message);
      // 出错时设置为空数组
      setRoles([]);
    }
  };
  
  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };
  
  const handleEdit = (record) => {
    setEditingUser(record);
    form.setFieldsValue({
      ...record,
      password: '',
      confirm_password: ''
    });
    setModalVisible(true);
  };
  
  const handleDelete = async (id) => {
    try {
      await deleteUser(id);
      message.success('删除成功');
      fetchUsers2();
    } catch (error) {
      message.error('删除失败: ' + error.message);
    }
  };
  
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的用户');
      return;
    }
    try {
      // 批量删除用户
      await Promise.all(selectedRowKeys.map(id => deleteUser(id)));
      message.success(`成功删除${selectedRowKeys.length}个用户`);
      setSelectedRowKeys([]);
      fetchUsers2();
    } catch (error) {
      message.error('批量删除失败: ' + error.message);
    }
  };
  
  const handleResetPassword = async (id) => {
    try {
      await resetUserPassword(id);
      message.success('密码已重置为 dzt123');
      fetchUsers2();
    } catch (error) {
      message.error('重置密码失败: ' + error.message);
    }
  };
  
  const handleModalOk = () => {
    form.validateFields().then(async values => {
      try {
        // 处理密码字段
        const userData = { ...values };
        
        if (editingUser) {
          // 更新用户
          // 如果没有输入新密码，则移除密码相关字段
          if (!userData.new_password) {
            delete userData.old_password;
            delete userData.new_password;
            delete userData.confirm_new_password;
          } else {
            // 如果输入了新密码，验证确认密码
            if (userData.new_password !== userData.confirm_new_password) {
              message.error('两次输入的新密码不一致!');
              return;
            }
            // 移除确认密码字段
            delete userData.confirm_new_password;
          }
          
          await updateUser(editingUser.id, userData);
          message.success('更新成功');
        } else {
          // 添加用户
          // 验证密码确认
          if (userData.password !== userData.confirm_password) {
            message.error('两次输入的密码不一致!');
            return;
          }
          // 移除确认密码字段
          delete userData.confirm_password;
          
          await createUser(userData);
          message.success('添加成功');
        }
        setModalVisible(false);
        form.resetFields();
        fetchUsers2();
      } catch (error) {
        message.error((editingUser ? '更新' : '添加') + '失败: ' + error.message);
      }
    });
  };
  
  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };
  
  const handleSearch = (values) => {
    // 执行搜索操作
    fetchUsers2(values);
  };
  
  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };
  
  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };
  
  const hasSelected = selectedRowKeys.length > 0;
  
  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '角色',
      dataIndex: 'role_id',
      key: 'role_id',
      render: (_, record) => {
        // 添加保护性检查，确保roles是数组
        if (!Array.isArray(roles)) {
          return '';
        }
        const role = roles.find(r => r.id === record.role_id);
        return role ? role.name : '';
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <span>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="确定要删除这个用户吗?"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
          <Button 
            type="link" 
            icon={<RedoOutlined />} 
            onClick={() => handleResetPassword(record.id)}
            title="重置密码"
          />
        </span>
      ),
    },
  ];
  
  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增
          </Button>
          <Button 
            type="primary" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={handleBatchDelete}
            disabled={!hasSelected}
            style={{ marginLeft: 8 }}
          >
            批量删除
          </Button>
          <span style={{ marginLeft: 8 }}>
            {hasSelected ? `选择了 ${selectedRowKeys.length} 项` : ''}
          </span>
        </div>
        <div>
          <Form layout="inline" onFinish={handleSearch}>
            <Form.Item name="role_id">
              <Select placeholder="角色分类" allowClear style={{ width: 120 }}>
              {Array.isArray(roles) && roles.map(role => (
                <Option key={role.id} value={role.id}>{role.name}</Option>
              ))}
            </Select>
            </Form.Item>
            <Form.Item name="username">
              <Input placeholder="用户名称" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                搜索
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
      <Table 
        dataSource={users} 
        columns={columns} 
        loading={loading}
        rowKey="id"
        rowSelection={rowSelection}
      />
      
      <Modal
        title={editingUser ? "编辑用户" : "新增用户"}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="role_id"
            label="角色"
            rules={[{ required: true, message: '请选择角色!' }]}
          >
            <Select>
              {Array.isArray(roles) && roles.map(role => (
                <Option key={role.id} value={role.id}>{role.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input />
          </Form.Item>
          {!editingUser && (
            <>
              <Form.Item
                name="password"
                label="密码"
                rules={[{ required: true, message: '请输入密码!' }]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item
                name="confirm_password"
                label="确认密码"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致!'));
                    },
                  }),
                ]}
              >
                <Input.Password />
              </Form.Item>
            </>
          )}
          {editingUser && (
            <>
              <Form.Item
                name="old_password"
                label="旧密码"
                rules={[{ required: true, message: '请输入旧密码!' }]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item
                name="new_password"
                label="新密码"
              >
                <Input.Password />
              </Form.Item>
              <Form.Item
                name="confirm_new_password"
                label="确认新密码"
                dependencies={['new_password']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('new_password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致!'));
                    },
                  }),
                ]}
              >
                <Input.Password />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;