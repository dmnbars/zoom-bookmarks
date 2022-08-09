import { List, ActionPanel, Form, Action, Icon, useNavigation, LocalStorage, open } from "@raycast/api";
import { useCallback, useState, useEffect } from "react";

interface Bookmark {
    title: string;
    id: number;
}

type State = {
    isLoading: boolean;
    bookmarks: Bookmark[];
};

export default function Command() {
    const [state, setState] = useState<State>({
        isLoading: true,
        bookmarks: [],
    });

    useEffect(() => {
        (async () => {
            const storedBookmarks = await LocalStorage.getItem<string>("bookmarks");

            if (!storedBookmarks) {
                setState((previous) => ({ ...previous, isLoading: false }));
                return;
            }

            try {
                const bookmarks: Bookmark[] = JSON.parse(storedBookmarks);
                setState((previous) => ({ ...previous, bookmarks, isLoading: false }));
            } catch (e) {
                // can't decode todos
                setState((previous) => ({ ...previous, bookmarks: [], isLoading: false }));
            }
        })();
    }, []);

    useEffect(() => {
        LocalStorage.setItem("bookmarks", JSON.stringify(state.bookmarks));
    }, [state.bookmarks]);


    const handleCreate = useCallback(
        (title: string, id: number) => {
            const newBookmarks = [...state.bookmarks, { title, id }];
            setState((previous) => ({ ...previous, bookmarks: newBookmarks }));
        },
        [state.bookmarks, setState]
    );

    const handleDelete = useCallback(
        (index: number) => {
            const newBookmarks = [...state.bookmarks];
            newBookmarks.splice(index, 1);
            setState((previous) => ({ ...previous, bookmarks: newBookmarks }));
        },
        [state.bookmarks, setState]
    );

    const handleJoin = useCallback(
        (index: number) => {
            const bookmarks = [...state.bookmarks];
            open(`zoommtg://zoom.us/join?action=join&confno=${bookmarks[index].id}`);
        },
        [state.bookmarks]
    );

    return (
        <List
            isLoading={state.isLoading}
            actions={
                <ActionPanel>
                    <CreateBookmarkAction onCreate={handleCreate} />
                </ActionPanel>
            }
        >
            {state.bookmarks.map((bookmark, index) => (
                <List.Item
                    title={bookmark.title}
                    key={bookmark.id}
                    actions={
                        <ActionPanel>
                            <ActionPanel.Section>
                                <Action title="Join" onAction={() => handleJoin(index)} />
                            </ActionPanel.Section>
                            <ActionPanel.Section>
                                <CreateBookmarkAction onCreate={handleCreate} />
                                <DeleteTodoAction onDelete={() => handleDelete(index)} />
                            </ActionPanel.Section>
                        </ActionPanel>
                    }
                />
            ))}
        </List>
    );
}

function CreateBookmarkAction(props: { defaultTitle?: string; onCreate: (title: string, id: number) => void }) {
    return (
        <Action.Push
            icon={Icon.Pencil}
            title="Create Bookmark"
            shortcut={{ modifiers: ["cmd"], key: "n" }}
            target={<CreateBookmarkForm onCreate={props.onCreate} />}
        />
    );
}

function CreateBookmarkForm(props: { onCreate: (title: string, id: number) => void }) {
    const { pop } = useNavigation();

    function handleSubmit(values: { title: string, id: number }) {
        props.onCreate(values.title, values.id );
        pop();
    }

    return (
        <Form
            actions={
                <ActionPanel>
                    <Action.SubmitForm title="Create Bookmark" onSubmit={handleSubmit} />
                </ActionPanel>
            }
        >
            <Form.TextField id="title" title="Title" />
            <Form.TextField id="id" title="Conference room number" />
        </Form>
    );
}

function DeleteTodoAction(props: { onDelete: () => void }) {
    return (
        <Action
            icon={Icon.Trash}
            title="Delete Bookmark"
            shortcut={{modifiers: ["ctrl"], key: "x"}}
            onAction={props.onDelete}
        />
    );
}
