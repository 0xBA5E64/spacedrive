import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { ArrowsOutCardinal, DotsThreeVertical, GearSix } from '@phosphor-icons/react';
import clsx from 'clsx';
import { createElement, lazy, Suspense, useEffect, useMemo } from 'react';
import { useSnapshot } from 'valtio';
import { Button, Card, CheckBox, DropdownMenu } from '@sd/ui';
import { useLocale } from '~/hooks';

import { CardConfig, defaultCards, overviewStore, type CardSize } from './store';

export interface FileKind {
	kind: number;
	name: string;
	count: bigint;
	total_bytes: bigint;
}

// Define components mapping with component types instead of JSX.Element
const CARD_COMPONENTS: Record<string, React.ComponentType> = {
	'library-stats': lazy(() => import('./cards/LibraryStats')),
	'favorites': lazy(() => import('./cards/FavoriteItems')),
	'device-list': lazy(() => import('./cards/DeviceList')),
	'file-kind-stats': lazy(() => import('./cards/FileKindStats')),
	'recent-files': lazy(() => import('./cards/RecentItems')),
	'recent-locations': lazy(() => import('./cards/RecentLocations'))
};

interface CardHeadingProps {
	title: string;
	onSizeChange?: (size: CardSize) => void;
	dragHandleProps?: any;
}

function CardHeading({ title, onSizeChange, dragHandleProps }: CardHeadingProps) {
	const { t } = useLocale();

	const store = useSnapshot(overviewStore);

	const size = useMemo(() => {
		return store.cards.find((card) => card.title === title)?.size;
	}, [store.cards, title]);

	return (
		<div
			className="mb-2 flex cursor-grab items-center justify-between active:cursor-grabbing"
			{...dragHandleProps}
		>
			<div className="flex items-center gap-2">
				<div className="text-ink-dull">
					<ArrowsOutCardinal className="size-4" />
				</div>
				<span className="text-sm font-medium text-ink-dull">{title}</span>
			</div>

			<DropdownMenu.Root
				trigger={
					<Button size="icon" variant="outline">
						<DotsThreeVertical className="size-4" />
					</Button>
				}
				side="left"
				sideOffset={5}
				alignOffset={-10}
			>
				<DropdownMenu.Item onClick={() => onSizeChange?.('small')}>
					<CheckBox checked={size === 'small'} />
					{t('small')}
				</DropdownMenu.Item>
				<DropdownMenu.Item onClick={() => onSizeChange?.('medium')}>
					<CheckBox checked={size === 'medium'} />
					{t('medium')}
				</DropdownMenu.Item>
				<DropdownMenu.Item onClick={() => onSizeChange?.('large')}>
					<CheckBox checked={false} />
					{t('large')}
				</DropdownMenu.Item>
			</DropdownMenu.Root>
		</div>
	);
}

export function OverviewCard({
	children,
	className,
	size = 'medium',
	onSizeChange,
	id,
	dragHandleProps,
	title
}: {
	children: React.ReactNode;
	className?: string;
	size?: CardSize;
	onSizeChange?: (size: CardSize) => void;
	id: string;
	dragHandleProps?: any;
	title: string;
}) {
	return (
		<Card
			className={clsx(
				'flex h-[300px] flex-col overflow-hidden bg-app-box/70 p-4 transition-colors',
				className
			)}
		>
			<CardHeading
				title={title}
				onSizeChange={onSizeChange}
				dragHandleProps={dragHandleProps}
			/>
			{children}
		</Card>
	);
}

// Add a wrapper component to handle hot reloading
const CardWrapper = ({ id }: { id: string }) => {
	const CardComponent = CARD_COMPONENTS[id];
	return CardComponent ? <CardComponent /> : null;
};

export const Component = () => {
	const store = useSnapshot(overviewStore);
	const { t } = useLocale();

	const handleCardSizeChange = (id: string, size: CardSize) => {
		const cardIndex = overviewStore.cards.findIndex((card) => card.id === id);
		if (cardIndex !== -1 && overviewStore.cards[cardIndex]?.id) {
			overviewStore.cards[cardIndex] = {
				...overviewStore.cards[cardIndex],
				size
			};
		}
	};

	const handleCardToggle = (id: string) => {
		const cardIndex = overviewStore.cards.findIndex((card) => card.id === id);
		if (cardIndex !== -1 && overviewStore.cards[cardIndex]?.id) {
			overviewStore.cards[cardIndex].enabled = !overviewStore.cards[cardIndex].enabled;
		}
	};

	const handleDragEnd = (result: any) => {
		if (!result.destination) return;

		const items = Array.from(overviewStore.cards);
		const [reorderedItem] = items.splice(result.source.index, 1);
		if (reorderedItem) {
			items.splice(result.destination.index, 0, reorderedItem);
		}

		overviewStore.cards = items;
	};

	const handleResetCards = () => {
		overviewStore.cards = defaultCards;
	};

	return (
		<div className="relative">
			<div className="absolute right-0 top-0 flex justify-end p-4">
				<DropdownMenu.Root
					trigger={
						<Button size="icon" variant="outline">
							<GearSix className="size-4" />
						</Button>
					}
					side="bottom"
					sideOffset={5}
				>
					{store.cards.map((card) => (
						<DropdownMenu.Item key={card.id} onClick={() => handleCardToggle(card.id)}>
							<CheckBox checked={card.enabled} />
							{card.title}
						</DropdownMenu.Item>
					))}
					<DropdownMenu.Separator />
					<DropdownMenu.Item onClick={() => handleResetCards()}>Reset</DropdownMenu.Item>
				</DropdownMenu.Root>
			</div>

			<DragDropContext onDragEnd={handleDragEnd}>
				<Droppable droppableId="overview-cards">
					{(provided) => (
						<div
							{...provided.droppableProps}
							ref={provided.innerRef}
							className="grid grid-cols-1 gap-4 p-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-4"
						>
							{store.cards
								.filter((card) => card.enabled)
								.map((card, index) => (
									<Draggable key={card.id} draggableId={card.id} index={index}>
										{(provided) => (
											<div
												ref={provided.innerRef}
												{...provided.draggableProps}
												className={clsx('w-full', {
													'col-span-1': card.size === 'small',
													'col-span-1 sm:col-span-1':
														card.size === 'small',
													'col-span-1 md:col-span-1 xl:col-span-2':
														card.size === 'medium',
													'col-span-1 sm:col-span-2 lg:col-span-4':
														card.size === 'large'
												})}
											>
												<OverviewCard
													id={card.id}
													size={card.size}
													onSizeChange={(size) =>
														handleCardSizeChange(card.id, size)
													}
													dragHandleProps={provided.dragHandleProps}
													title={card.title}
												>
													<Suspense fallback={<div>Loading...</div>}>
														<CardWrapper id={card.id} />
													</Suspense>
												</OverviewCard>
											</div>
										)}
									</Draggable>
								))}
							{provided.placeholder}
						</div>
					)}
				</Droppable>
			</DragDropContext>
		</div>
	);
};
