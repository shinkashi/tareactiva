import React, { useState, useEffect, useRef } from 'react';
import { Task } from './task.ts';

import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import { Button } from 'react-bootstrap';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import './TaskTable.css';

function StartButton({ params, tasks, trigger }) {
  return (
    <Button
      variant="outline-primary"
      size="sm"
      onClick={async () => {
        const task = tasks.find((task) => task.id === params.data.id);
        if (task) {
          await task.start();
          trigger();
        }
      }}
    >
      ▶️
    </Button>
  );
}

function StopButton({ params, tasks, trigger }) {
  return (
    <Button
      variant="outline-primary"
      size="sm"
      onClick={async () => {
        const task = tasks.find((task) => task.id === params.data.id);
        if (task) {
          await task.renew();
          trigger();
        }
      }}
    >
      ■
    </Button>
  );
}

function DeleteButton({ params, tasks, trigger }) {
  return (
    <Button
      variant="outline-danger"
      size="sm"
      onClick={async () => {
        const task = tasks.find((task) => task.id === params.data.id);
        if (task) {
          await task.delete();
          trigger();
        }
      }}
    >
      <i className="bi bi-trash"></i>
    </Button>
  );
}

export default function TaskTable({
  tasks,
  trigger,
}: {
  tasks: Task[];
  trigger: () => void;
}) {
  const makeValueGetter = (field: string) => (params: any) =>
    params.data[field] ? dayjs(params.data[field]).format('MM-DD HH:mm') : '';

  const makeValueSetter = (field: string) => (params: any) => {
    if (!params.newValue) {
      params.data[field] = null;
    } else if (params.newValue.includes('-')) {
      params.data[field] = dayjs(
        dayjs().format('YYYY-') + ' ' + params.newValue,
      );
    } else {
      params.data[field] = dayjs(
        dayjs().format('YYYY-MM-DD') + ' ' + params.newValue,
      );
    }
    return true;
  };

  const columns: ColDef<Task>[] = [
    {
      headerName: 'Action',
      cellRenderer: (params: any) => {
        const status = params.data.status();
        const startStopButton =
          status === 'inprogress' ? (
            <StopButton params={params} tasks={tasks} trigger={trigger} />
          ) : (
            <StartButton params={params} tasks={tasks} trigger={trigger} />
          );
        return (
          <>
            {startStopButton}
            <DeleteButton params={params} tasks={tasks} trigger={trigger} />
          </>
        );
      },
    },
    {
      headerName: 'Name',
      field: 'name',
      editable: true,
      cellEditor: 'agTextCellEditor',
      rowDrag: true,
    },
    {
      headerName: 'Duration',
      field: 'duration',
      editable: true,
      cellEditor: 'agTextCellEditor',
    },
    {
      headerName: 'PlanAt',
      field: 'planAt',
      valueGetter: makeValueGetter('planAt'),
      valueSetter: makeValueSetter('planAt'),
      editable: true,
      cellEditor: 'agTextCellEditor',
    },
    {
        headerName: 'ScheduledAt',
        field: 'scheduledAt',
        valueGetter: makeValueGetter('scheduledAt'),
        valueSetter: makeValueSetter('scheduledAt'),
        editable: true,
        cellEditor: 'agTextCellEditor',
      },
      {
      headerName: 'StartAt',
      field: 'startAt',
      valueGetter: makeValueGetter('startAt'),
      valueSetter: makeValueSetter('startAt'),
      editable: true,
      cellEditor: 'agTextCellEditor',
    },
    {
      headerName: 'EndAt',
      field: 'endAt',
      valueGetter: makeValueGetter('endAt'),
      valueSetter: makeValueSetter('endAt'),
      editable: true,
      cellEditor: 'agTextCellEditor',
    },
  ];

  const onCellValueChanged = (params: { data: Task }) => {
    params.data.update();
    // trigger();
    // handleInputChange(params.data.id, params.colDef.field, params.newValue);
  };

  const getRowClass = (params: any) => {
    const task: Task = params.data;

    if (task.isInProgress()) {
      return 'task-in-progress';
    }
    return '';
  };

  return (
    <div
      className="ag-theme-alpine table-container"
      style={{ height: 'calc(100vh - 200px)', width: '100%' }}
    >
      <AgGridReact
        rowData={tasks}
        columnDefs={columns}
        onCellValueChanged={onCellValueChanged}
        defaultColDef={{ flex: 1, minWidth: 100 }}
        rowDragManaged={true}
        getRowClass={getRowClass}
      />
    </div>
  );
}
