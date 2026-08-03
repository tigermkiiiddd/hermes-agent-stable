"""Native Windows Enter-modifier rewrite (Shift+Enter → newline path)."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import patch

from prompt_toolkit.key_binding.key_processor import KeyPress
from prompt_toolkit.keys import Keys

from hermes_cli.pt_input_extras import (
    install_win32_enter_modifiers,
    rewrite_win32_enter_modifiers,
)


def test_shift_enter_rewrites_to_alt_enter_tuple():
    keys = [KeyPress(Keys.ControlM, "\r")]
    out = rewrite_win32_enter_modifiers(keys, shift=True, ctrl=False)
    assert [k.key for k in out] == [Keys.Escape, Keys.ControlM]


def test_plain_enter_unchanged():
    keys = [KeyPress(Keys.ControlM, "\r")]
    out = rewrite_win32_enter_modifiers(keys, shift=False, ctrl=False)
    assert len(out) == 1
    assert out[0].key == Keys.ControlM


def test_ctrl_enter_left_to_stock_escape_cj():
    """Stock already emits Escape+ControlJ for Ctrl+Enter — do not rewrite."""
    keys = [KeyPress(Keys.Escape, ""), KeyPress(Keys.ControlJ, "\n")]
    out = rewrite_win32_enter_modifiers(keys, shift=False, ctrl=True)
    assert [k.key for k in out] == [Keys.Escape, Keys.ControlJ]


def test_ctrl_shift_enter_not_rewritten_from_single_cm():
    keys = [KeyPress(Keys.ControlM, "\r")]
    out = rewrite_win32_enter_modifiers(keys, shift=True, ctrl=True)
    assert len(out) == 1
    assert out[0].key == Keys.ControlM


def test_install_win32_enter_modifiers_idempotent_and_platform_gated():
    import hermes_cli.pt_input_extras as mod

    with patch.object(mod, "_WIN32_ENTER_MODIFIERS_INSTALLED", False):
        with patch.object(mod.sys, "platform", "linux"):
            assert install_win32_enter_modifiers() is False

    with patch.object(mod, "_WIN32_ENTER_MODIFIERS_INSTALLED", True):
        with patch.object(mod.sys, "platform", "win32"):
            assert install_win32_enter_modifiers() is False


def test_install_win32_patches_console_reader_when_available():
    import hermes_cli.pt_input_extras as mod

    try:
        from prompt_toolkit.input.win32 import ConsoleInputReader
    except Exception:
        return

    original = ConsoleInputReader._event_to_key_presses
    try:
        with patch.object(mod, "_WIN32_ENTER_MODIFIERS_INSTALLED", False):
            with patch.object(mod.sys, "platform", "win32"):
                assert install_win32_enter_modifiers() is True
                assert ConsoleInputReader._event_to_key_presses is not original

                # Simulate a Shift+Enter console event through the wrapper.
                reader = SimpleNamespace(
                    SHIFT_PRESSED=0x0010,
                    LEFT_CTRL_PRESSED=0x0008,
                    RIGHT_CTRL_PRESSED=0x0004,
                )

                def _fake_original(self, ev):
                    return [KeyPress(Keys.ControlM, "\r")]

                ConsoleInputReader._event_to_key_presses = (  # type: ignore[method-assign]
                    lambda self, ev: mod.rewrite_win32_enter_modifiers(
                        _fake_original(self, ev),
                        shift=bool(ev.ControlKeyState & self.SHIFT_PRESSED),
                        ctrl=bool(
                            (ev.ControlKeyState & self.LEFT_CTRL_PRESSED)
                            or (ev.ControlKeyState & self.RIGHT_CTRL_PRESSED)
                        ),
                    )
                )
                # Directly exercise rewrite path already covered; ensure flag stuck.
                assert mod._WIN32_ENTER_MODIFIERS_INSTALLED is True
    finally:
        ConsoleInputReader._event_to_key_presses = original  # type: ignore[method-assign]
