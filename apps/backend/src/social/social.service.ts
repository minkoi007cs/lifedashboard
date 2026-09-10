import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialChannel } from './entities/social-channel.entity';
import { SocialPost } from './entities/social-post.entity';
import type {
  CreateSocialPostDto,
  SocialChannel as SharedSocialChannel,
  SocialPost as SharedSocialPost,
  SocialPlatform,
  SocialPostStatus,
} from '@life-dashboard/shared';

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  constructor(
    @InjectRepository(SocialChannel)
    private readonly channelRepo: Repository<SocialChannel>,
    @InjectRepository(SocialPost)
    private readonly postRepo: Repository<SocialPost>,
  ) {}

  async getChannels(userId: string): Promise<SharedSocialChannel[]> {
    const count = await this.channelRepo.count({ where: { userId } });
    if (count === 0) {
      await this.seedDefaultChannelsAndPosts(userId);
    }

    const channels = await this.channelRepo.find({
      where: { userId },
      order: { followersCount: 'DESC' },
    });

    return channels.map((c) => ({
      id: c.id,
      platform: c.platform as SocialPlatform,
      name: c.name,
      handle: c.handle,
      avatarUrl: c.avatarUrl,
      followersCount: c.followersCount,
      profileUrl: c.profileUrl,
      lastSyncedAt: c.lastSyncedAt ? c.lastSyncedAt.toISOString() : undefined,
    }));
  }

  async createChannel(
    userId: string,
    data: {
      platform: SocialPlatform;
      name: string;
      handle: string;
      followersCount?: number;
      profileUrl?: string;
    },
  ): Promise<SocialChannel> {
    const channel = this.channelRepo.create({
      userId,
      platform: data.platform,
      name: data.name,
      handle: data.handle,
      followersCount: data.followersCount || 0,
      profileUrl: data.profileUrl,
      lastSyncedAt: new Date(),
    });
    return this.channelRepo.save(channel);
  }

  async deleteChannel(id: string, userId: string): Promise<{ success: boolean }> {
    const channel = await this.channelRepo.findOne({ where: { id, userId } });
    if (!channel) throw new NotFoundException('Social channel not found');
    await this.channelRepo.remove(channel);
    return { success: true };
  }

  async getPosts(
    userId: string,
    filters?: { status?: string; platform?: string },
  ): Promise<SharedSocialPost[]> {
    const qb = this.postRepo
      .createQueryBuilder('p')
      .where('p.userId = :userId', { userId })
      .orderBy('p.createdAt', 'DESC');

    if (filters?.status && filters.status !== 'all') {
      qb.andWhere('p.status = :status', { status: filters.status });
    }

    const posts = await qb.getMany();

    return posts.map((p) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      platforms: (p.platforms as SocialPlatform[]) || [],
      status: p.status as SocialPostStatus,
      scheduledAt: p.scheduledAt ? p.scheduledAt.toISOString() : undefined,
      publishedAt: p.publishedAt ? p.publishedAt.toISOString() : undefined,
      postUrl: p.postUrl,
      mediaUrls: p.mediaUrls,
      hashtags: p.hashtags || [],
      metrics: p.metrics,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  }

  async createPost(userId: string, dto: CreateSocialPostDto): Promise<SocialPost> {
    const post = this.postRepo.create({
      userId,
      title: dto.title,
      content: dto.content,
      platforms: dto.platforms || ['facebook'],
      status: dto.status || 'idea',
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      hashtags: dto.hashtags || [],
      mediaUrls: dto.mediaUrls || [],
    });
    return this.postRepo.save(post);
  }

  async updatePost(
    id: string,
    userId: string,
    dto: Partial<CreateSocialPostDto> & { status?: string },
  ): Promise<SocialPost> {
    const post = await this.postRepo.findOne({ where: { id, userId } });
    if (!post) throw new NotFoundException('Post not found');

    if (dto.title !== undefined) post.title = dto.title;
    if (dto.content !== undefined) post.content = dto.content;
    if (dto.platforms !== undefined) post.platforms = dto.platforms;
    if (dto.status !== undefined) post.status = dto.status;
    if (dto.scheduledAt !== undefined)
      post.scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : undefined;
    if (dto.hashtags !== undefined) post.hashtags = dto.hashtags;

    return this.postRepo.save(post);
  }

  async deletePost(id: string, userId: string): Promise<{ success: boolean }> {
    const post = await this.postRepo.findOne({ where: { id, userId } });
    if (!post) throw new NotFoundException('Post not found');
    await this.postRepo.remove(post);
    return { success: true };
  }

  async generateAiContent(
    topic: string,
    platform: SocialPlatform,
  ): Promise<{ caption: string; hook: string; hashtags: string[] }> {
    let hook = `Bí quyết tối ưu hóa hiệu suất với LifeOS mà ít ai nói cho bạn biết! 🚀`;
    let caption = `Bạn có cảm thấy công việc và cuộc sống cá nhân đôi khi quá tải? \n\nTrong bài viết hôm nay, mình chia sẻ 3 thói quen đơn giản giúp duy trì Deep Work và kiểm soát tài chính mỗi ngày mà không bị kiệt sức. Hãy thử áp dụng ngay hôm nay nhé!`;
    let hashtags = ['#Productivity', '#LifeOS', '#DeepWork', '#Habits'];

    if (platform === 'tiktok' || platform === 'youtube') {
      hook = `DỪNG LẠI! 3 giây này sẽ thay đổi cách bạn quản lý thời gian mãi mãi ⏳`;
      caption = `Kịch bản ngắn 30s:\n[0-3s]: Hook cảnh báo\n[3-15s]: Nêu vấn đề phân tâm bởi thông báo\n[15-25s]: Cách dùng Pomodoro 25m + AI Daily Digest\n[25-30s]: CTA lưu video và follow!`;
      hashtags = ['#Shorts', '#TikTokTips', '#KyLuatBanThan', '#Focus'];
    } else if (platform === 'linkedin') {
      hook = `Kiến trúc hệ thống LifeOS cá nhân: Khi kỹ thuật phần mềm áp dụng vào tối ưu hóa cuộc sống.`;
      caption = `Là một kỹ sư phần mềm, tôi nhận ra bài toán lớn nhất không phải là code, mà là quản lý năng lượng và sự tập trung. \n\nChia sẻ kinh nghiệm xây dựng monorepo kết hợp AI Agent giúp tự động hóa tổng hợp email và phân bổ thời gian hiệu quả.`;
      hashtags = ['#SoftwareEngineering', '#Leadership', '#WorkLifeBalance'];
    }

    return { hook, caption, hashtags };
  }

  async getOverview(userId: string) {
    const channels = await this.getChannels(userId);
    const posts = await this.getPosts(userId);

    const totalFollowers = channels.reduce((acc, c) => acc + c.followersCount, 0);
    const publishedCount = posts.filter((p) => p.status === 'published').length;
    const scheduledCount = posts.filter((p) => p.status === 'scheduled').length;
    const ideaCount = posts.filter((p) => p.status === 'idea').length;

    return {
      totalFollowers,
      totalChannels: channels.length,
      publishedCount,
      scheduledCount,
      ideaCount,
      channels,
    };
  }

  private async seedDefaultChannelsAndPosts(userId: string) {
    const defaultChannels = [
      {
        userId,
        platform: 'youtube',
        name: 'Khoi Hoang Tech & Life',
        handle: '@khoihoang_dev',
        followersCount: 12400,
        profileUrl: 'https://youtube.com',
        lastSyncedAt: new Date(),
      },
      {
        userId,
        platform: 'tiktok',
        name: 'Khôi Daily Tech',
        handle: '@khoi.lifeos',
        followersCount: 45200,
        profileUrl: 'https://tiktok.com',
        lastSyncedAt: new Date(),
      },
      {
        userId,
        platform: 'facebook',
        name: 'Khôi Hoàng Page',
        handle: 'khoihoang.official',
        followersCount: 8900,
        profileUrl: 'https://facebook.com',
        lastSyncedAt: new Date(),
      },
      {
        userId,
        platform: 'linkedin',
        name: 'Khoi Hoang',
        handle: 'in/khoi-hoang',
        followersCount: 3200,
        profileUrl: 'https://linkedin.com',
        lastSyncedAt: new Date(),
      },
    ];

    for (const c of defaultChannels) {
      await this.channelRepo.save(this.channelRepo.create(c));
    }

    const defaultPosts = [
      {
        userId,
        title: 'Review hệ điều hành LifeOS cá nhân: Quản lý 5 trong 1',
        content: 'Chia sẻ quy trình tự động hóa email, calo, thói quen và tài chính cá nhân trong 1 dashboard duy nhất.',
        platforms: ['youtube', 'facebook'],
        status: 'published',
        publishedAt: new Date(),
        hashtags: ['#LifeOS', '#Productivity', '#TechReview'],
        metrics: { views: 4250, likes: 380, comments: 45, shares: 18 },
      },
      {
        userId,
        title: 'Thử thách 7 ngày Deep Work không mạng xã hội',
        content: 'Kịch bản video TikTok 60 giây chia sẻ cảm giác sau 1 tuần tập trung cao độ bằng Pomodoro Timer.',
        platforms: ['tiktok'],
        status: 'scheduled',
        scheduledAt: new Date(Date.now() + 24 * 3600 * 1000),
        hashtags: ['#DeepWork', '#FocusChallenge', '#TikTokTips'],
      },
      {
        userId,
        title: 'Tại sao monorepo NestJS + React là lựa chọn hoàn hảo cho dự án cá nhân?',
        content: 'Bài viết phân tích kiến trúc code sharing qua npm workspaces và Turbo.',
        platforms: ['linkedin'],
        status: 'draft',
        hashtags: ['#NestJS', '#React', '#Monorepo'],
      },
      {
        userId,
        title: 'Ý tưởng video: 1 ngày làm việc của Fullstack Dev với AI Assistant',
        content: 'Quay góc làm việc, các lệnh Cmd+K, và cách AI Assistant tóm tắt email buổi sáng.',
        platforms: ['youtube', 'tiktok'],
        status: 'idea',
        hashtags: ['#DevLife', '#AIAgent'],
      },
    ];

    for (const p of defaultPosts) {
      await this.postRepo.save(this.postRepo.create(p));
    }
  }
}
