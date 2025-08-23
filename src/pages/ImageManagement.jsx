import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Input, message, 
  Popconfirm, Select, Upload, Image, Checkbox
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  UploadOutlined, DownloadOutlined 
} from '@ant-design/icons';
import { fetchImages, createImage, updateImage, deleteImage, fetchCategories } from '../services/api';
import { convertArrayTimeFields } from '../utils/timeUtils';

const { Option } = Select;

const ImageManagement = () => {
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [form] = Form.useForm();
  
  // 从数据库获取数据
  const loadImages = async () => {
    setLoading(true);
    try {
      const data = await fetchImages();
      // 格式化时间字段
      const formattedData = convertArrayTimeFields(data);
      setImages(formattedData);
    } catch (error) {
      console.error('Error fetching images:', error);
      message.error('获取图片数据失败');
    } finally {
      setLoading(false);
    }
  };
  
  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      message.error('获取分类数据失败');
    }
  };
  
  useEffect(() => {
    loadImages();
    loadCategories();
  }, []);
  
  const handleAdd = () => {
    setEditingImage(null);
    form.resetFields();
    setModalVisible(true);
  };
  
  const handleEdit = (record) => {
    setEditingImage(record);
    
    // 确保category_id被正确设置
    const initialValues = {
      ...record,
      category_id: (record.category_id !== undefined && record.category_id !== null) ? record.category_id : null
    };
    
    form.setFieldsValue(initialValues);
    
    // 设置文件列表，用于编辑时显示当前图片
    if (record.image_path) {
      setFileList([
        {
          uid: '-1',
          name: record.name,
          status: 'done',
          url: record.image_path,
        }
      ]);
    }
    setModalVisible(true);
  };
  
  const handleDelete = async (id) => {
    try {
      await deleteImage(id);
      message.success('删除成功');
      loadImages();
    } catch (error) {
      message.error('删除失败: ' + error.message);
    }
  };
  
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的图片');
      return;
    }
    try {
      // 批量删除图片
      await Promise.all(selectedRowKeys.map(id => deleteImage(id)));
      message.success(`成功删除${selectedRowKeys.length}张图片`);
      setSelectedRowKeys([]);
      loadImages();
    } catch (error) {
      message.error('批量删除失败: ' + error.message);
    }
  };
  
  const handleModalOk = () => {
    form.validateFields().then(async values => {
      try {
        console.log('Form values:', values); // 调试信息
        // 检查category_id是否在values中
        if (values.category_id === undefined) {
          console.error('category_id is missing in form values');
          console.log('Editing image data:', editingImage);
        }
        if (editingImage) {
          // 更新图片
          // 创建FormData对象来发送文件
          const formData = new FormData();
          
          // 确保所有必需的字段都被添加到FormData中
          const name = values.name || editingImage.name;
          const description = values.description || editingImage.description || '';
          // 修复category_id的处理逻辑
          console.log('Values category_id:', values.category_id);
          console.log('EditingImage category_id:', editingImage.category_id);
          const category_id = (values.category_id !== undefined && values.category_id !== null) ? values.category_id : editingImage.category_id;
          console.log('Final category_id:', category_id);
          
          // 添加调试信息
          console.log('Updating image with values:', { name, description, category_id, values, editingImage });
          console.log('FormData before append:', formData);
          
          formData.append('name', name);
          formData.append('description', description);
          // 在添加category_id之前检查其值
          console.log('Value of category_id before append:', category_id);
          formData.append('category_id', category_id);
          
          // 验证category_id是否正确添加到FormData
          console.log('FormData after append category_id:', formData.get('category_id'));
          
          // 添加上传的文件
          if (fileList.length > 0) {
            if (fileList[0].originFileObj) {
              // 新上传的文件
              formData.append('image', fileList[0].originFileObj);
            } else if (editingImage && fileList[0].url) {
              // 使用现有的图片
              formData.append('image_path', editingImage.image_path);
            }
          }
          
          await updateImage(editingImage.id, formData);
          message.success('更新成功');
        } else {
          // 添加图片
          // 创建FormData对象来发送文件
          const formData = new FormData();
          Object.keys(values).forEach(key => {
            if (key !== 'image') {
              formData.append(key, values[key]);
            }
          });
          
          // 添加上传的文件
          if (fileList.length > 0 && fileList[0].originFileObj) {
            formData.append('image', fileList[0].originFileObj);
          }
          
          await createImage(formData);
          message.success('添加成功');
        }
        setModalVisible(false);
        setFileList([]); // 清空文件列表
        form.resetFields();
        loadImages();
      } catch (error) {
        message.error((editingImage ? '更新' : '添加') + '失败: ' + error.message);
      }
    });
  };
  
  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };
  
  const handleSearch = async (values) => {
    setLoading(true);
    try {
      const data = await fetchImages(values);
      setImages(data);
      message.success('搜索完成');
    } catch (error) {
      console.error('Error searching images:', error);
      message.error('搜索失败');
    } finally {
      setLoading(false);
    }
  };
  
  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };
  
  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };
  
  const hasSelected = selectedRowKeys.length > 0;
  
  // 获取分类名称
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : '';
  };

  const columns = [
    {
      title: '图片分类',
      dataIndex: 'category_id',
      key: 'category_id',
      render: (_, record) => getCategoryName(record.category_id)
    },
    {
      title: '图片名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '图片描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '图片',
      dataIndex: 'image_path',
      key: 'image_path',
      render: (_, record) => (
        <Image
          width={100}
          src={record.image_path}
          placeholder={<div>加载中...</div>}
        />
      )
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
            title="确定要删除这张图片吗?"
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
            <Form.Item name="category_id">
              <Select placeholder="图片分类" allowClear style={{ width: 120 }}>
              {categories.map(category => (
                <Option key={category.id} value={category.id}>{category.name}</Option>
              ))}
            </Select>
            </Form.Item>
            <Form.Item name="name">
              <Input placeholder="图片名称" />
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
        dataSource={images} 
        columns={columns} 
        loading={loading}
        rowKey="id"
        rowSelection={rowSelection}
      />
      
      <Modal
        title={editingImage ? "编辑图片" : "新增图片"}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="category_id"
            label="图片分类"
            rules={[{ required: true, message: '请选择图片分类!' }]}
          >
            <Select>
              {categories.map(category => (
                <Option key={category.id} value={category.id}>{category.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="name"
            label="图片名称"
            rules={[{ required: true, message: '请输入图片名称!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="图片描述"
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item
            name="image"
            label="上传图片"
            rules={[{ required: true, message: '请上传图片!' }]}
          >
            <Upload 
              name="image" 
              listType="picture"
              maxCount={1}
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
            >
              <Button icon={<UploadOutlined />}>点击上传</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ImageManagement;