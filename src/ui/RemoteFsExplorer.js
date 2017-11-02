import React from 'react';
import PropTypes from 'prop-types';

import { Icon, Table, Modal, Button } from 'antd';
import style from '../Tube.mcss';

export default class RemoteFsExplorer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      path: '/',
      curSelection: '',
      listing: [],
    };
  }

  componentWillReceiveProps(props) {
    if (props.visible) {
      this.selectEntry({ name: this.state.path, type: 'directory' });
    }
  }

  selectEntry(entry) {
    const path = `${this.state.path}/${entry.name}`.replace(/\/+/, '/');
    if (entry.type === 'directory') {
      this.navigate(path);
    } else {
      this.props.onFileSelect(path);
    }
  }

  navigate(path) {
    this.props.dataManager.fs.listdir(path).then((resp) => {
      if (resp.status === 'ok') {
        const listing = resp.result;
        const cmpFunc = (a, b) => a.name > b.name;
        const directories = listing.filter(e => e.type === 'directory').sort(cmpFunc);
        const files = listing.filter(e => e.type === 'file').sort(cmpFunc);
        this.setState({ path, listing: [].concat(directories, files) });
      } else {
        Modal.error({ content: resp.reason });
      }
    });
  }

  goUp() {
    const updir = this.state.path.split('/').slice(0, -1).join('/');
    this.navigate(updir === '' ? '/' : updir);
  }

  render() {
    const columns = [
      {
        dataIndex: 'type',
        render: (type) => {
          const name = type === 'directory' ? 'folder' : 'file';
          return <Icon type={name} />;
        },
      },
      {
        dataIndex: 'name',
      },
    ];

    return (
      <Modal
        title="Remote FS Explorer"
        visible={this.props.visible}
        okText="Open"
        onOk={() => this.selectEntry(this.state.curSelection)}
        onCancel={this.props.onCancel}
      >
        <div style={{ marginBottom: '10px' }}>
          <Button shape="circle" icon="home" />
          <span className="ant-divider" />
          <Button shape="circle" icon="up" onClick={() => this.goUp()} />
        </div>
        <Table
          showHeader={false}
          pagination={false}
          columns={columns}
          scroll={{ y: 400 }}
          dataSource={this.state.listing}
          rowClassName={(entry, index) => [style.fsrow, (entry.name === this.state.curSelection ? style.fsrowSelect : '')].join(' ')}
          onRowClick={(entry, index, ev) => this.setState({ curSelection: entry.name })}
          onRowDoubleClick={(entry, index, ev) => this.selectEntry(entry)}
        />
      </Modal>
    );
  }
}

RemoteFsExplorer.propTypes = {
  dataManager: PropTypes.object.isRequired,
  visible: PropTypes.bool.isRequired,
  onFileSelect: PropTypes.func,
  onCancel: PropTypes.func,
};

RemoteFsExplorer.defaultProps = {
  onFileSelect: () => {},
  onCancel: () => {},
};
