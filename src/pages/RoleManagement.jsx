import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { fetchRoles as fetchRolesAPI, createRole, updateRole, deleteRole } from '../services/api';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form] = Form.useForm();
  
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await fetchRolesAPI();
      setRoles(data);
    } catch (error) {
      message.error('获取角色数据失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRoles();
  }, []);
  
  const handleAdd = () => {
    setEditingRole(null);
    form.resetFields();
    setModalVisible(true);
  };
  
  const handleEdit = (record) => {
    setEditingRole(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };
  
  const handleDelete = async (id) => {
    try {
      await deleteRole(id);
      message.success('删除成功');
      fetchRoles();
    } catch (error) {
      message.error('删除失败: ' + error.message);
    }
  };
  
  const handleModalOk = () => {
    form.validateFields().then(async values => {
      try {
        if (editingRole) {
          // 更新角色
          await updateRole(editingRole.id, values);
          message.success('更新成功');
        } else {
          // 添加角色
          await createRole(values);
          message.success('添加成功');
        }
        setModalVisible(false);
        form.resetFields();
        fetchRoles();
      } catch (error) {
        message.error((editingRole ? '更新' : '添加') + '失败: ' + error.message);
      }
    });
  };
  
  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };
  
  const columns = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '角色描述',
      dataIndex: 'description',
      key: 'description',
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
            title="确定要删除这个角色吗?"
            description="删除角色前请确保该角色下没有用户数据"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </span>
      ),
    },
  ];
  
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增
        </Button>
      </div>
      <Table 
        dataSource={roles} 
        columns={columns} 
        loading={loading}
        rowKey="id"
      />
      
      <Modal
        title={editingRole ? "编辑角色" : "新增角色"}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="角色描述"
          >
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoleManagement;