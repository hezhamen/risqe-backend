import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async getNotifications(
    userId: string,
    type?: 'all' | 'payments_due' | 'voting_due',
    limit: number = 50,
    offset: number = 0,
  ): Promise<{
    notifications: Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      time: string;
      createdAt: Date;
      read: boolean;
      groupId?: string | null;
      actionUrl?: string | null;
    }>;
    total: number;
    unreadCount: number;
  }> {
    const where: any = { userId };

    if (type && type !== 'all') {
      if (type === 'payments_due') {
        where.type = 'PAYMENT_DUE';
      } else if (type === 'voting_due') {
        where.type = 'VOTING_DUE';
      }
    }

    const [notifications, total] = await this.notificationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    const unreadCount = await this.notificationRepository.count({
      where: { userId, read: false },
    });

    const formatTimeAgo = (date: Date): string => {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    const formattedNotifications = notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      time: formatTimeAgo(notification.createdAt),
      createdAt: notification.createdAt,
      read: notification.read,
      groupId: notification.groupId,
      actionUrl: notification.actionUrl,
    }));

    return {
      notifications: formattedNotifications,
      total,
      unreadCount,
    };
  }
}
