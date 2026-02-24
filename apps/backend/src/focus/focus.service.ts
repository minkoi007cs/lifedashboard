import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FocusSession } from './focus.entity';

@Injectable()
export class FocusService {
    constructor(
        @InjectRepository(FocusSession)
        private focusRepository: Repository<FocusSession>,
    ) { }

    async findAll(userId: string): Promise<FocusSession[]> {
        return this.focusRepository.find({ where: { userId }, order: { startTime: 'DESC' } });
    }

    async create(createDto: Partial<FocusSession>, userId: string): Promise<FocusSession> {
        const session = this.focusRepository.create({ ...createDto, userId });
        return this.focusRepository.save(session);
    }

    async remove(id: string, userId: string): Promise<void> {
        const result = await this.focusRepository.delete({ id, userId });
        if (result.affected === 0) {
            throw new NotFoundException(`Session with ID "${id}" not found`);
        }
    }

    async getStats(userId: string): Promise<any> {
        const sessions = await this.findAll(userId);
        const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
        const count = sessions.length;
        return { totalMinutes, count };
    }
}
