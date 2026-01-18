'use client';

import { Card, List, Typography, Spin, Empty } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';

const { Title, Text } = Typography;

export default function EventsFeedPage() {
    const { data: events, isLoading } = useQuery({
        queryKey: ['events', 'feed'],
        queryFn: async () => (await fetch('/api/community/events?feed=true')).json()
    });

    return (
        <div className="max-w-3xl mx-auto pb-20">
            <div className="mb-8">
                <Title level={2}><CalendarOutlined /> Upcoming Events</Title>
                <Text type="secondary">Discover events from the community.</Text>
            </div>

            {isLoading ? <Spin size="large" /> : (
                events && events.length > 0 ? (
                    <List
                        dataSource={events}
                        renderItem={(item: any) => (
                            <List.Item>
                                <Card className="w-full hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <Title level={4} style={{ margin: 0 }}>{item.title}</Title>
                                            <p className="text-blue-600 font-bold mb-2">{new Date(item.date).toLocaleString()}</p>
                                            <p className="text-gray-600">{item.description}</p>
                                            <div className="mt-2 text-xs text-gray-400 uppercase tracking-wide">
                                                Location: {item.location || 'TBA'}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </List.Item>
                        )}
                    />
                ) : <Empty description="No upcoming events found." />
            )}
        </div>
    );
}
