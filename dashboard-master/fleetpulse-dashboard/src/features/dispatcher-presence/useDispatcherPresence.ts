import { useEffect, useRef } from 'react';
import { WsClient } from '../../core/realtime/wsClient';
import { useAppDispatch } from '../../shared/hooks/useAppDispatch';
import {
    setChannelStatus,
} from '../observability/connectionSlice';
import {
    dispatcherJoined,
    dispatcherLeft,
    dispatcherViewingTruck,
    registerCurrentDispatcher,
} from './dispatchersSlice';
import { fetchRoutes } from '../route-management/routesSlice';
import { setDispatchersSnapshot } from './dispatchersSlice';

export function useDispatcherPresence() {
    const dispatch = useAppDispatch();
    const clientRef = useRef<WsClient | null>(null);

    useEffect(() => {
        const client = new WsClient();
        clientRef.current = client;

        dispatch(
            setChannelStatus({
                channel: 'ws',
                status: 'connecting',
            })
        );

        const connect = () => {
            client.connect((message) => {
            dispatch(
                setChannelStatus({
                    channel: 'ws',
                    status: 'connected',
                })
            );

            switch (message.type) {
                case 'registered':
                    dispatch(
                        registerCurrentDispatcher({
                            id: message.dispatcherId,
                            name: message.name,
                        })
                    );
                    break;

                case 'dispatcher_joined':
                    dispatch(
                        dispatcherJoined({
                            id: message.dispatcherId,
                            name: message.name,
                            joinedAt: message.joinedAt,
                        })
                    );
                    break;
                case 'dispatchers_snapshot':
                    dispatch(setDispatchersSnapshot(message.dispatchers));
                    break;
                case 'dispatcher_left':
                    dispatch(
                        dispatcherLeft({
                            id: message.dispatcherId,
                            leftAt: message.leftAt,
                        })
                    );
                    break;

                case 'dispatcher_viewing':
                    dispatch(
                        dispatcherViewingTruck({
                            id: message.dispatcherId,
                            truckId: message.truckId,
                            timestamp: message.timestamp,
                        })
                    );
                    break;

                case 'route_assigned':
                case 'route_updated':
                case 'route_reassigned':
                    dispatch(fetchRoutes());
                    break;

                case 'pong':
                    dispatch(
                        setChannelStatus({
                            channel: 'ws',
                            status: 'connected',
                        })
                    );
                    break;

                default:
                    break;
            }
            }, (status) => {
                if (status === 'open') {
                    dispatch(
                        setChannelStatus({
                            channel: 'ws',
                            status: 'connected',
                            errorMessage: null,
                        })
                    );
                    return;
                }

                if (status === 'error') {
                    dispatch(
                        setChannelStatus({
                            channel: 'ws',
                            status: 'error',
                            errorMessage: 'WebSocket unavailable',
                        })
                    );
                    return;
                }

                dispatch(
                    setChannelStatus({
                        channel: 'ws',
                        status: 'disconnected',
                    })
                );
            });
        };

        connect();

        const dispatcherName = `Dispatcher-${Math.floor(Math.random() * 10000)}`;
        client.send({
            type: 'register_dispatcher',
            name: dispatcherName,
        });

        return () => {
            client.disconnect();

            dispatch(
                setChannelStatus({
                    channel: 'ws',
                    status: 'disconnected',
                })
            );
        };
    }, [dispatch]);

    return clientRef;
}