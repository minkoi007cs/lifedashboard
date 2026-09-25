import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/user.entity';
import { AssistantMessageEntity } from './assistant-message.entity';

@Entity('assistant_conversations')
export class AssistantConversation extends BaseEntity {
  @Column({ default: 'Cuộc trò chuyện mới' })
  title: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => AssistantMessageEntity, (msg) => msg.conversation, {
    cascade: true,
  })
  messages: AssistantMessageEntity[];
}
