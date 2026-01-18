'use client';

import { useState } from 'react';
import { Card, Button, Input, DatePicker, List, Typography, Modal, message } from 'antd';
import { PlusOutlined, CalendarOutlined } from '@ant-design/icons';
import { usePrivy } from '@privy-io/react-auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function ArtistEventsPage() {
    const { user, getAccessToken } = usePrivy();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [loc, setLoc] = useState('');
    const [date, setDate] = useState<any>(null);

    const { data: events, isLoading } = useQuery({
        queryKey: ['events', user?.wallet?.address],
        queryFn: async () => {
            if (!user?.wallet?.address) return [];
            return (await fetch(`/api/community/events?artistWallet=${user.wallet.address}`)).json();
        },
        enabled: !!user?.wallet?.address
    });

    const { mutateAsync: createEvent, isPending } = useMutation({
        mutationFn: async () => {
            const token = await getAccessToken();
            const res = await fetch('/api/community/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: token,
                    title,
                    description: desc,
                    location: loc,
                    date: date.toISOString()
                })
            });
            if (!res.ok) throw new Error('Failed');
            return res.json();
        },
        onSuccess: () => {
            message.success('Event created');
            queryClient.invalidateQueries({ queryKey: ['events'] });
            setIsModalOpen(false);
            setTitle(''); setDesc(''); setLoc(''); setDate(null);
        }
    });

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Title level={2}>My Events</Title>
                    <Text type="secondary">Schedule shows, AMAs, or meetups.</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
                    Create Event
                </Button>
            </div>

            <List
                grid={{ gutter: 16, column: 2 }}
                dataSource={Array.isArray(events) ? events : []}
                loading={isLoading}
                renderItem={(item: any) => (
                    <List.Item>
                        <Card title={item.title} extra={new Date(item.date).toLocaleDateString()}>
                            <p className="font-bold text-blue-600 mb-2">{item.location}</p>
                            <p>{item.description}</p>
                        </Card>
                    </List.Item>
                )}
            />

            <Modal title="Create Event" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => createEvent()} confirmLoading={isPending}>
                <Input placeholder="Event Title" className="mb-4" value={title} onChange={e => setTitle(e.target.value)} />
                <Input.TextArea placeholder="Description" className="mb-4" rows={3} value={desc} onChange={e => setDesc(e.target.value)} />
                <Input placeholder="Location (URL or Place)" className="mb-4" value={loc} onChange={e => setLoc(e.target.value)} />
                <DatePicker className="w-full" showTime placeholder="Date & Time" value={date} onChange={setDate} />
            </Modal>
        </div>
    );
}
