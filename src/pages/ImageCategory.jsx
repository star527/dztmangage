import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../services/api';
import { convertObjectTimeFields } from '../utils/timeUtils';

const ImageCategory = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();
  
  // 从服务器获取数据
  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await fetchCategories();
      // 对时间字段进行格式化处理
      const formattedData = data.map(item => convertObjectTimeFields(item));
      setCategories(formattedData);
    } catch (error) {
      message.error('获取分类数据失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadCategories();
  }, []);
  
  const handleAdd = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalVisible(true);
  };
  
  const handleEdit = (record) => {
    setEditingCategory(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };
  
  const handleDelete = async (id) => {
    try {
      await deleteCategory(id);
      message.success('删除成功');
      loadCategories();
    } catch (error) {
      message.error('删除失败: ' + error.message);
    }
  };
  
  const handleModalOk = () => {
    form.validateFields().then(async values => {
      try {
        if (editingCategory) {
          // 更新操作
          await updateCategory(editingCategory.id, values);
          message.success('更新成功');
        } else {
          // 添加操作
          await createCategory(values);
          message.success('添加成功');
        }
        setModalVisible(false);
        form.resetFields();
        loadCategories();
      } catch (error) {
        message.error((editingCategory ? '更新' : '添加') + '失败: ' + error.message);
      }
    });
  };
  
  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };
  
  const columns = [
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '分类描述',
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
            title="确定要删除这个分类吗?"
            description="删除分类前请确保该分类下没有图片数据"
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
        dataSource={categories} 
        columns={columns} 
        loading={loading}
        rowKey="id"
      />
      
      <Modal
        title={editingCategory ? "编辑分类" : "新增分类"}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="分类描述"
          >
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ImageCategory;